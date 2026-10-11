"use server"

import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { generationCost, isOwnerEmail, parseOwnerEmails } from "@/generation/billing"
import { getSession } from "@/generation/session"
import { isSubmissionId } from "@/generation/submissions"

import { CHAT_MODEL, chatSystem } from "./prompts"
import { callChat, ClaudeError } from "./anthropic"
import {
  ASSISTANT_MESSAGE_PRICE_ID,
  CHAT_MESSAGE_MAX,
  CHAT_VISITOR_DAILY_MAX,
  cleanServiceInput,
  getService,
  jobTitle,
  normalizeWhatsapp,
  SLUG_PATTERN,
  splitHandoff,
} from "./catalog"
import type { ServiceInput } from "./catalog"
import { normalizeOutput } from "./outputs"
import type { ServiceOutput } from "./outputs"
import { refundJob, runJob, signJob } from "./run-job"

type Admin = ReturnType<typeof createSupabaseAdmin>

export type JobView = {
  id: string
  service: string
  title: string
  status: "queued" | "running" | "done" | "failed"
  cost: number
  error: string | null
  createdAt: string
  output: ServiceOutput | null
}

export type StartResult =
  | { ok: true; job: JobView; balance: number }
  | { ok: false; message: string; balance?: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DAY_MS = 24 * 60 * 60 * 1000

function failure(message: string, balance?: number): StartResult {
  return balance === undefined ? { ok: false, message } : { ok: false, message, balance }
}

async function readPrice(admin: Admin, priceId: string): Promise<number | null> {
  const { data } = await admin
    .from("model_prices")
    .select("credits")
    .eq("model_id", priceId)
    .maybeSingle()
  return data ? Number(data.credits) : null
}

async function readBalance(admin: Admin, userId: string): Promise<number> {
  const { data } = await admin
    .from("accounts")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle()
  return data ? Number(data.credits) : 0
}

/** Avisa a la función de fondo o, fuera de Netlify, ejecuta aquí mismo. */
async function dispatch(jobId: string): Promise<boolean> {
  const inline =
    process.env.CLAUDE_JOBS_INLINE === "1" || process.env.NODE_ENV !== "production"
  if (inline) {
    await runJob(jobId)
    return true
  }
  const base = (process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
  if (!base) return false
  try {
    const response = await fetch(`${base}/.netlify/functions/claude-job-background`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, signature: signJob(jobId) }),
      signal: AbortSignal.timeout(15_000),
    })
    return response.status === 202 || response.ok
  } catch {
    return false
  }
}

/**
 * Cobra el servicio, guarda el pedido y lo manda a trabajar. El mismo
 * submissionId nunca cobra dos veces (doble clic, otra pestaña).
 */
export async function startServiceJob(data: unknown): Promise<StartResult> {
  try {
    const session = await getSession()
    if (!session) return failure("Inicia sesión para usar los servicios.")
    const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
    const service = getService(body.service)
    if (!service) return failure("Servicio desconocido.")
    const submissionId = body.submissionId
    if (typeof submissionId !== "string" || !isSubmissionId(submissionId))
      return failure("Solicitud inválida. Recarga la página.")

    let input: ServiceInput
    try {
      input = cleanServiceInput(service, body.input)
    } catch (caught) {
      return failure(caught instanceof Error ? caught.message : "Revisa el formulario.")
    }

    const admin = createSupabaseAdmin()

    // Rehacer la ficha de un asistente propio.
    if (service.id === "asistente" && typeof body.assistantId === "string") {
      if (!UUID.test(body.assistantId)) return failure("Asistente inválido.")
      const { data: own } = await admin
        .from("assistants")
        .select("id")
        .eq("id", body.assistantId)
        .eq("user_id", session.userId)
        .maybeSingle()
      if (!own) return failure("Ese asistente no es de tu cuenta.")
      input.assistant_id = body.assistantId
    }

    let cost = 0
    if (!session.isOwner) {
      const computed = generationCost(await readPrice(admin, service.priceId), {})
      if (computed === null)
        return failure("Este servicio todavía no tiene precio. Escríbenos para activarlo.")
      cost = computed
    }

    const begun = await admin.rpc("begin_generation", {
      p_user: session.userId,
      p_submission: submissionId,
      p_model: service.priceId,
      p_cost: cost,
    })
    if (begun.error) {
      if (begun.error.message.includes("insufficient_credits"))
        return failure(
          "No te alcanzan los créditos para este servicio. Recarga para continuar.",
          await readBalance(admin, session.userId)
        )
      return failure("No se pudo registrar el cobro. Intenta de nuevo.")
    }
    const row = begun.data?.[0]
    if (!row) return failure("No se pudo registrar el cobro. Intenta de nuevo.")
    const generationId = String(row.out_generation_id)
    const balance = Number(row.out_balance)

    if (row.out_duplicate) {
      const { data: existing } = await admin
        .from("claude_jobs")
        .select("id, service, title, status, error, created_at, output")
        .eq("generation_id", generationId)
        .maybeSingle()
      if (!existing) return failure("Este pedido ya se está procesando.", balance)
      return { ok: true, job: toView(existing, cost), balance }
    }

    const inserted = await admin
      .from("claude_jobs")
      .insert({
        user_id: session.userId,
        generation_id: generationId,
        service: service.id,
        title: jobTitle(service, input),
        input,
      })
      .select("id, service, title, status, error, created_at, output")
      .single()
    if (inserted.error || !inserted.data) {
      const refunded = await admin.rpc("refund_generation", {
        p_generation: generationId,
        p_note: "No se pudo guardar el pedido",
      })
      return failure(
        "No se pudo guardar el pedido. No se te cobró.",
        refunded.error ? balance : Number(refunded.data)
      )
    }

    const jobId = String(inserted.data.id)
    const sent = await dispatch(jobId)
    if (!sent) {
      await refundJob(admin, { id: jobId, generation_id: generationId }, "No se pudo iniciar el trabajo")
      return failure(
        "No pudimos iniciar el trabajo. No se te cobró; intenta de nuevo.",
        await readBalance(admin, session.userId)
      )
    }

    const { data: fresh } = await admin
      .from("claude_jobs")
      .select("id, service, title, status, error, created_at, output")
      .eq("id", jobId)
      .single()
    return {
      ok: true,
      job: toView(fresh ?? inserted.data, cost),
      balance: await readBalance(admin, session.userId),
    }
  } catch (caught) {
    console.error("[servicios] start failed", {
      message: caught instanceof Error ? caught.message : "unknown",
    })
    return failure("Algo salió mal. Intenta de nuevo.")
  }
}

type JobRow = {
  id: unknown
  service: unknown
  title: unknown
  status: unknown
  error: unknown
  created_at: unknown
  output: unknown
}

function toView(row: JobRow, cost: number): JobView {
  const status = String(row.status)
  return {
    id: String(row.id),
    service: String(row.service),
    title: String(row.title),
    status: (["queued", "running", "done", "failed"].includes(status)
      ? status
      : "failed") as JobView["status"],
    cost,
    error: row.error ? String(row.error) : null,
    createdAt: String(row.created_at),
    output: row.output ? normalizeOutput(String(row.service), row.output) : null,
  }
}

/** Pedidos del usuario, los más nuevos primero. */
export async function listServiceJobs(): Promise<JobView[]> {
  const session = await getSession()
  if (!session) return []
  return readJobs(createSupabaseAdmin(), session.userId, null)
}

/** Estado de unos pedidos en vuelo (para el sondeo de la pantalla). */
export async function getServiceJobs(data: unknown): Promise<JobView[]> {
  const ids = Array.isArray(data) ? data.filter((x): x is string => typeof x === "string" && UUID.test(x)).slice(0, 20) : []
  if (!ids.length) return []
  const session = await getSession()
  if (!session) return []
  return readJobs(createSupabaseAdmin(), session.userId, ids)
}

async function readJobs(admin: Admin, userId: string, ids: string[] | null): Promise<JobView[]> {
  let query = admin
    .from("claude_jobs")
    .select("id, service, title, status, error, created_at, output, generation_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60)
  if (ids) query = query.in("id", ids)
  const { data } = await query
  const rows = data ?? []
  const genIds = rows.map((r) => String(r.generation_id))
  const gens = genIds.length
    ? await admin.from("generations").select("id, cost, status").in("id", genIds)
    : { data: [] as { id: unknown; cost: unknown; status: unknown }[] }
  const byGen = new Map((gens.data ?? []).map((g) => [String(g.id), g]))
  return rows.map((row) => {
    const gen = byGen.get(String(row.generation_id))
    const view = toView(row, gen ? Number(gen.cost) : 0)
    // El dueño devolvió el cobro desde /admin: el pedido ya no va a llegar.
    if (gen && String(gen.status) === "refunded" && view.status !== "failed")
      return { ...view, status: "failed", error: "Se devolvieron los créditos de este pedido." }
    return view
  })
}

/* ------------------------------------------------------------------ */
/* Asistentes: panel del dueño del negocio                             */
/* ------------------------------------------------------------------ */

export type AssistantView = {
  id: string
  slug: string
  businessName: string
  whatsapp: string | null
  greeting: string
  knowledge: string
  active: boolean
  dailyLimit: number
  repliesToday: number
  updatedAt: string
}

export type AssistantResult = { ok: true } | { ok: false; message: string }

export async function listAssistants(): Promise<AssistantView[]> {
  const session = await getSession()
  if (!session) return []
  const admin = createSupabaseAdmin()
  const { data } = await admin
    .from("assistants")
    .select("id, slug, business_name, whatsapp, greeting, knowledge, active, daily_limit, updated_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
  const since = new Date(Date.now() - DAY_MS).toISOString()
  return Promise.all(
    (data ?? []).map(async (row) => {
      const { count } = await admin
        .from("assistant_messages")
        .select("id", { count: "exact", head: true })
        .eq("assistant_id", row.id)
        .eq("role", "assistant")
        .gte("created_at", since)
      return {
        id: String(row.id),
        slug: String(row.slug),
        businessName: String(row.business_name),
        whatsapp: row.whatsapp ? String(row.whatsapp) : null,
        greeting: String(row.greeting ?? ""),
        knowledge: String(row.knowledge),
        active: !!row.active,
        dailyLimit: Number(row.daily_limit),
        repliesToday: count ?? 0,
        updatedAt: String(row.updated_at),
      }
    })
  )
}

/** Cambios gratis del dueño: ficha, saludo, WhatsApp, encendido y tope diario. */
export async function updateAssistant(data: unknown): Promise<AssistantResult> {
  const session = await getSession()
  if (!session) return { ok: false, message: "Inicia sesión." }
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  if (typeof body.id !== "string" || !UUID.test(body.id))
    return { ok: false, message: "Asistente inválido." }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.knowledge === "string") {
    const k = body.knowledge.trim()
    if (k.length < 40) return { ok: false, message: "La ficha es muy corta." }
    if (k.length > 14_000) return { ok: false, message: "La ficha es muy larga (máximo 14,000 caracteres)." }
    patch.knowledge = k
  }
  if (typeof body.greeting === "string") patch.greeting = body.greeting.trim().slice(0, 400)
  if (body.whatsapp !== undefined) {
    const phone = normalizeWhatsapp(body.whatsapp)
    if (!phone) return { ok: false, message: "WhatsApp inválido: usa código de país y solo números." }
    patch.whatsapp = phone
  }
  if (typeof body.active === "boolean") patch.active = body.active
  if (body.dailyLimit !== undefined) {
    const n = Number(body.dailyLimit)
    if (!Number.isInteger(n) || n < 0 || n > 5000)
      return { ok: false, message: "El tope diario va de 0 a 5000 respuestas." }
    patch.daily_limit = n
  }
  if (typeof body.slug === "string") {
    const slug = body.slug.trim().toLowerCase()
    if (!SLUG_PATTERN.test(slug))
      return { ok: false, message: "La dirección solo puede tener letras, números y guiones (3 a 40)." }
    patch.slug = slug
  }
  const { error, count } = await createSupabaseAdmin()
    .from("assistants")
    .update(patch, { count: "exact" })
    .eq("id", body.id)
    .eq("user_id", session.userId)
  if (error)
    return {
      ok: false,
      message: error.code === "23505" ? "Esa dirección ya está tomada." : "No se pudo guardar.",
    }
  if (!count) return { ok: false, message: "Ese asistente no es de tu cuenta." }
  return { ok: true }
}

export type Conversation = {
  visitor: string
  lastAt: string
  messages: { role: "user" | "assistant"; content: string; at: string }[]
}

/** Últimas conversaciones de un asistente propio, agrupadas por visitante. */
export async function getAssistantConversations(data: unknown): Promise<Conversation[]> {
  const session = await getSession()
  if (!session || typeof data !== "string" || !UUID.test(data)) return []
  const admin = createSupabaseAdmin()
  const { data: own } = await admin
    .from("assistants")
    .select("id")
    .eq("id", data)
    .eq("user_id", session.userId)
    .maybeSingle()
  if (!own) return []
  const { data: rows } = await admin
    .from("assistant_messages")
    .select("visitor, role, content, created_at")
    .eq("assistant_id", data)
    .order("created_at", { ascending: false })
    .limit(300)
  const groups = new Map<string, Conversation>()
  for (const row of (rows ?? []).slice().reverse()) {
    const visitor = String(row.visitor)
    const group = groups.get(visitor) ?? { visitor, lastAt: "", messages: [] }
    group.messages.push({
      role: row.role === "assistant" ? "assistant" : "user",
      content: String(row.content),
      at: String(row.created_at),
    })
    group.lastAt = String(row.created_at)
    groups.set(visitor, group)
  }
  return [...groups.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt)).slice(0, 30)
}

/* ------------------------------------------------------------------ */
/* Asistente público: lo usa cualquier cliente del negocio, sin cuenta */
/* ------------------------------------------------------------------ */

export type ChatResult =
  | { ok: true; reply: string; handoff: boolean }
  | { ok: false; message: string; handoff: boolean }

const VISITOR = /^[a-z0-9-]{16,64}$/i

export async function askAssistant(data: unknown): Promise<ChatResult> {
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const slug = typeof body.slug === "string" ? body.slug : ""
  const visitor = typeof body.visitor === "string" ? body.visitor : ""
  const text = typeof body.text === "string" ? body.text.replace(/\u0000/g, "").trim() : ""
  if (!SLUG_PATTERN.test(slug) || !VISITOR.test(visitor))
    return { ok: false, message: "Recarga la página e intenta de nuevo.", handoff: false }
  if (!text) return { ok: false, message: "Escribe tu pregunta.", handoff: false }
  if (text.length > CHAT_MESSAGE_MAX)
    return { ok: false, message: `Tu mensaje es muy largo (máximo ${CHAT_MESSAGE_MAX} caracteres).`, handoff: false }

  const admin = createSupabaseAdmin()
  const { data: assistant } = await admin
    .from("assistants")
    .select("id, user_id, business_name, knowledge, active, daily_limit")
    .eq("slug", slug)
    .maybeSingle()
  const unavailable: ChatResult = {
    ok: false,
    message: "El asistente no está disponible ahora mismo. Escríbenos directo por WhatsApp.",
    handoff: true,
  }
  if (!assistant || !assistant.active) return unavailable

  const since = new Date(Date.now() - DAY_MS).toISOString()
  const [today, mine] = await Promise.all([
    admin
      .from("assistant_messages")
      .select("id", { count: "exact", head: true })
      .eq("assistant_id", assistant.id)
      .eq("role", "assistant")
      .gte("created_at", since),
    admin
      .from("assistant_messages")
      .select("id", { count: "exact", head: true })
      .eq("assistant_id", assistant.id)
      .eq("visitor", visitor)
      .eq("role", "user")
      .gte("created_at", since),
  ])
  if ((today.count ?? 0) >= Number(assistant.daily_limit)) return unavailable
  if ((mine.count ?? 0) >= CHAT_VISITOR_DAILY_MAX)
    return {
      ok: false,
      message: "Para seguir atendiéndote, escríbenos por WhatsApp.",
      handoff: true,
    }

  // Cobro al dueño del asistente (el dueño del estudio no paga).
  const { data: account } = await admin
    .from("accounts")
    .select("email")
    .eq("user_id", assistant.user_id)
    .maybeSingle()
  const studioOwner = isOwnerEmail(
    account?.email ? String(account.email) : null,
    parseOwnerEmails(process.env.OWNER_EMAILS)
  )
  let cost = 0
  if (!studioOwner) {
    const computed = generationCost(await readPrice(admin, ASSISTANT_MESSAGE_PRICE_ID), {})
    if (computed === null) return unavailable
    cost = computed
  }
  const begun = await admin.rpc("begin_generation", {
    p_user: assistant.user_id,
    p_submission: crypto.randomUUID(),
    p_model: ASSISTANT_MESSAGE_PRICE_ID,
    p_cost: cost,
  })
  const row = begun.data?.[0]
  if (begun.error || !row) return unavailable
  const generationId = String(row.out_generation_id)

  const { data: history } = await admin
    .from("assistant_messages")
    .select("role, content")
    .eq("assistant_id", assistant.id)
    .eq("visitor", visitor)
    .order("created_at", { ascending: false })
    .limit(12)
  const messages = (history ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content),
    }))
  // La conversación debe empezar con el cliente y alternar.
  while (messages.length && messages[0]?.role !== "user") messages.shift()
  const turns: { role: "user" | "assistant"; content: string }[] = []
  for (const m of [...messages, { role: "user" as const, content: text }]) {
    const last = turns[turns.length - 1]
    if (last && last.role === m.role) last.content = `${last.content}\n${m.content}`
    else turns.push({ ...m })
  }

  try {
    const system = chatSystem(String(assistant.business_name), String(assistant.knowledge))
    const { text: raw } = await callChat({
      model: CHAT_MODEL,
      maxTokens: 500,
      rules: system.rules,
      knowledge: system.knowledge,
      messages: turns,
    })
    const { text: reply, handoff } = splitHandoff(raw)
    await admin.from("assistant_messages").insert([
      { assistant_id: assistant.id, visitor, role: "user", content: text },
      { assistant_id: assistant.id, visitor, role: "assistant", content: reply },
    ])
    await admin
      .from("generations")
      .update({ status: "completed", settled_at: new Date().toISOString() })
      .eq("id", generationId)
      .eq("status", "charged")
    return { ok: true, reply, handoff }
  } catch (caught) {
    await admin.rpc("refund_generation", {
      p_generation: generationId,
      p_note: "El asistente no pudo responder",
    })
    return {
      ok: false,
      message:
        caught instanceof ClaudeError && caught.retryable
          ? "Estamos con mucha gente ahora. Intenta en un momento o escríbenos por WhatsApp."
          : "No pude responder ahora. Escríbenos por WhatsApp.",
      handoff: true,
    }
  }
}
