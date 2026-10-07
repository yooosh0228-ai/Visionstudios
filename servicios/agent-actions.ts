"use server"

import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { generationCost } from "@/generation/billing"
import { getSession } from "@/generation/session"
import { isSubmissionId } from "@/generation/submissions"

import {
  AGENT_CHAT_MAX_REPLIES,
  buildTurns,
  chatTitle,
  cleanAgentMessage,
  getAgent,
} from "./agents"
import type { AgentId, Turn } from "./agents"
import { callAgent, ClaudeError } from "./anthropic"
import { AGENT_MESSAGE_PRICE_ID } from "./catalog"
import { AGENT_MODEL, agentSystem } from "./prompts"

type Admin = ReturnType<typeof createSupabaseAdmin>

export type AgentChatSummary = {
  id: string
  agent: AgentId
  title: string
  updatedAt: string
}

export type AgentMessageView = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export type SendAgentResult =
  | { ok: true; chat: AgentChatSummary; messages: AgentMessageView[]; balance: number }
  | { ok: false; message: string; balance?: number }

export type AgentChatResult = { ok: true } | { ok: false; message: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TRUNCATED_NOTE = "\n\n_(La respuesta se cortó por larga. Escribe «sigue» para continuar.)_"

function toSummary(row: { id: unknown; agent: unknown; title: unknown; updated_at: unknown }): AgentChatSummary | null {
  const agent = getAgent(row.agent)
  if (!agent) return null
  return {
    id: String(row.id),
    agent: agent.id,
    title: String(row.title),
    updatedAt: String(row.updated_at),
  }
}

function toMessage(row: { id: unknown; role: unknown; content: unknown; created_at: unknown }): AgentMessageView {
  return {
    id: String(row.id),
    role: row.role === "assistant" ? "assistant" : "user",
    content: String(row.content),
    createdAt: String(row.created_at),
  }
}

async function readBalance(admin: Admin, userId: string): Promise<number> {
  const { data } = await admin.from("accounts").select("credits").eq("user_id", userId).maybeSingle()
  return data ? Number(data.credits) : 0
}

async function ownChat(admin: Admin, userId: string, chatId: string) {
  const { data } = await admin
    .from("agent_chats")
    .select("id, agent, title, updated_at")
    .eq("id", chatId)
    .eq("user_id", userId)
    .maybeSingle()
  return data
}

/** Conversaciones del usuario, las más recientes primero. */
export async function listAgentChats(): Promise<AgentChatSummary[]> {
  const session = await getSession()
  if (!session) return []
  const { data } = await createSupabaseAdmin()
    .from("agent_chats")
    .select("id, agent, title, updated_at")
    .eq("user_id", session.userId)
    .order("updated_at", { ascending: false })
    .limit(100)
  return (data ?? []).map(toSummary).filter((c): c is AgentChatSummary => c !== null)
}

/** Mensajes de una conversación propia, en orden. */
export async function getAgentChat(data: unknown): Promise<AgentMessageView[] | null> {
  const session = await getSession()
  if (!session || typeof data !== "string" || !UUID.test(data)) return null
  const admin = createSupabaseAdmin()
  if (!(await ownChat(admin, session.userId, data))) return null
  const { data: rows } = await admin
    .from("agent_messages")
    .select("id, role, content, created_at")
    .eq("chat_id", data)
    .order("id", { ascending: true })
    .limit(400)
  return (rows ?? []).map(toMessage)
}

/**
 * Cobra una respuesta, le pregunta al agente y guarda el par de mensajes.
 * El mismo submissionId nunca cobra dos veces. Si el agente no responde,
 * se devuelven los créditos y no se guarda nada.
 */
export async function sendAgentMessage(data: unknown): Promise<SendAgentResult> {
  try {
    const session = await getSession()
    if (!session) return { ok: false, message: "Inicia sesión para hablar con los agentes." }
    const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
    const agent = getAgent(body.agent)
    if (!agent) return { ok: false, message: "Agente desconocido." }
    const submissionId = body.submissionId
    if (typeof submissionId !== "string" || !isSubmissionId(submissionId))
      return { ok: false, message: "Solicitud inválida. Recarga la página." }
    let text: string
    try {
      text = cleanAgentMessage(body.text)
    } catch (caught) {
      return { ok: false, message: caught instanceof Error ? caught.message : "Revisa tu mensaje." }
    }

    const admin = createSupabaseAdmin()

    // Conversación existente: debe ser propia, del mismo agente y no estar llena.
    let chatId: string | null = null
    let history: Turn[] = []
    if (body.chatId !== null && body.chatId !== undefined) {
      if (typeof body.chatId !== "string" || !UUID.test(body.chatId))
        return { ok: false, message: "Conversación inválida." }
      const chat = await ownChat(admin, session.userId, body.chatId)
      if (!chat) return { ok: false, message: "Esa conversación no es de tu cuenta." }
      if (chat.agent !== agent.id) return { ok: false, message: "Esa conversación es de otro agente." }
      chatId = String(chat.id)
      const { data: rows } = await admin
        .from("agent_messages")
        .select("role, content")
        .eq("chat_id", chatId)
        .order("id", { ascending: false })
        .limit(AGENT_CHAT_MAX_REPLIES * 2)
      const all = (rows ?? []).slice().reverse()
      if (all.filter((r) => r.role === "assistant").length >= AGENT_CHAT_MAX_REPLIES)
        return { ok: false, message: "Esta conversación ya es muy larga. Empieza una nueva para seguir." }
      history = all.map((r) => ({
        role: r.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(r.content),
      }))
    }

    let cost = 0
    if (!session.isOwner) {
      const { data: priceRow } = await admin
        .from("model_prices")
        .select("credits")
        .eq("model_id", AGENT_MESSAGE_PRICE_ID)
        .maybeSingle()
      const computed = generationCost(priceRow ? Number(priceRow.credits) : null, {})
      if (computed === null)
        return { ok: false, message: "Los agentes todavía no tienen precio. Escríbenos para activarlos." }
      cost = computed
    }

    const begun = await admin.rpc("begin_generation", {
      p_user: session.userId,
      p_submission: submissionId,
      p_model: AGENT_MESSAGE_PRICE_ID,
      p_cost: cost,
    })
    if (begun.error) {
      if (begun.error.message.includes("insufficient_credits"))
        return {
          ok: false,
          message: "No te alcanzan los créditos para esta respuesta. Recarga para continuar.",
          balance: await readBalance(admin, session.userId),
        }
      return { ok: false, message: "No se pudo registrar el cobro. Intenta de nuevo." }
    }
    const row = begun.data?.[0]
    if (!row) return { ok: false, message: "No se pudo registrar el cobro. Intenta de nuevo." }
    if (row.out_duplicate)
      return { ok: false, message: "Ese mensaje ya se envió.", balance: Number(row.out_balance) }
    const generationId = String(row.out_generation_id)

    const refund = async (note: string) => {
      const { error } = await admin.rpc("refund_generation", { p_generation: generationId, p_note: note })
      if (error) console.error("[agentes] refund failed", { generation: generationId })
    }

    let reply: Awaited<ReturnType<typeof callAgent>>
    try {
      reply = await callAgent({
        model: AGENT_MODEL,
        maxTokens: 1400,
        system: agentSystem(agent.id),
        messages: buildTurns(history, text),
      })
    } catch (caught) {
      await refund("El agente no pudo responder")
      const reason =
        caught instanceof ClaudeError && caught.retryable
          ? `${caught.message}. No se te cobró; intenta de nuevo.`
          : "El agente no pudo responder. No se te cobró."
      return { ok: false, message: reason, balance: await readBalance(admin, session.userId) }
    }

    const now = new Date().toISOString()
    if (!chatId) {
      const created = await admin
        .from("agent_chats")
        .insert({ user_id: session.userId, agent: agent.id, title: chatTitle(text) })
        .select("id")
        .single()
      if (created.error || !created.data) {
        await refund("No se pudo guardar la conversación")
        return {
          ok: false,
          message: "No se pudo guardar la conversación. No se te cobró.",
          balance: await readBalance(admin, session.userId),
        }
      }
      chatId = String(created.data.id)
    }

    const content = reply.truncated ? `${reply.text}${TRUNCATED_NOTE}` : reply.text
    const inserted = await admin
      .from("agent_messages")
      .insert([
        { chat_id: chatId, role: "user", content: text },
        { chat_id: chatId, role: "assistant", content, generation_id: generationId, usage: reply.usage },
      ])
      .select("id, role, content, created_at")
    if (inserted.error) {
      await refund("No se pudo guardar la respuesta")
      return {
        ok: false,
        message: "No se pudo guardar la respuesta. No se te cobró.",
        balance: await readBalance(admin, session.userId),
      }
    }

    await Promise.all([
      admin
        .from("generations")
        .update({ status: "completed", settled_at: now })
        .eq("id", generationId)
        .eq("status", "charged"),
      admin.from("agent_chats").update({ updated_at: now }).eq("id", chatId),
    ])

    const messages = (inserted.data ?? [])
      .map(toMessage)
      .sort((a, b) => Number(a.id) - Number(b.id))
    const { data: chatRow } = await admin
      .from("agent_chats")
      .select("id, agent, title, updated_at")
      .eq("id", chatId)
      .single()
    const chat = chatRow ? toSummary(chatRow) : null
    return {
      ok: true,
      chat: chat ?? { id: chatId, agent: agent.id, title: chatTitle(text), updatedAt: now },
      messages,
      balance: Number(row.out_balance),
    }
  } catch (caught) {
    console.error("[agentes] send failed", {
      message: caught instanceof Error ? caught.message : "unknown",
    })
    return { ok: false, message: "Algo salió mal. Intenta de nuevo." }
  }
}

export async function renameAgentChat(data: unknown): Promise<AgentChatResult> {
  const session = await getSession()
  if (!session) return { ok: false, message: "Inicia sesión." }
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  if (typeof body.id !== "string" || !UUID.test(body.id)) return { ok: false, message: "Conversación inválida." }
  const title = typeof body.title === "string" ? body.title.replace(/\u0000/g, "").trim().slice(0, 80) : ""
  if (!title) return { ok: false, message: "Escribe un nombre." }
  const { error, count } = await createSupabaseAdmin()
    .from("agent_chats")
    .update({ title }, { count: "exact" })
    .eq("id", body.id)
    .eq("user_id", session.userId)
  if (error) return { ok: false, message: "No se pudo renombrar." }
  if (!count) return { ok: false, message: "Esa conversación no es de tu cuenta." }
  return { ok: true }
}

export async function deleteAgentChat(data: unknown): Promise<AgentChatResult> {
  const session = await getSession()
  if (!session) return { ok: false, message: "Inicia sesión." }
  if (typeof data !== "string" || !UUID.test(data)) return { ok: false, message: "Conversación inválida." }
  const { error, count } = await createSupabaseAdmin()
    .from("agent_chats")
    .delete({ count: "exact" })
    .eq("id", data)
    .eq("user_id", session.userId)
  if (error) return { ok: false, message: "No se pudo borrar." }
  if (!count) return { ok: false, message: "Esa conversación no es de tu cuenta." }
  return { ok: true }
}
