/**
 * Ejecuta un trabajo ya cobrado: lo reclama una sola vez, llama a Claude,
 * guarda el resultado y cierra el cobro. Si algo falla, reembolsa.
 * Lo usa la función de fondo de Netlify (hasta 15 minutos) y, en desarrollo,
 * la acción del servidor directamente. Imports relativos a propósito: la
 * función de Netlify se empaqueta sin los alias de Next.
 */
import { createHmac, timingSafeEqual } from "node:crypto"

import { createSupabaseAdmin } from "../lib/supabase/admin"

import { callTool, ClaudeError } from "./anthropic"
import { getService, slugify } from "./catalog"
import type { ServiceInput } from "./catalog"
import { isUsable, normalizeOutput } from "./outputs"
import { recipeFor } from "./prompts"

type Admin = ReturnType<typeof createSupabaseAdmin>

/** Firma del aviso a la función de fondo: solo el servidor la puede calcular. */
export function signJob(jobId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  if (!secret) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY")
  return createHmac("sha256", secret).update(`claude-job:${jobId}`).digest("hex")
}

export function verifyJobSignature(jobId: string, signature: unknown): boolean {
  if (typeof signature !== "string" || !/^[0-9a-f]{64}$/.test(signature)) return false
  const expected = Buffer.from(signJob(jobId), "hex")
  const given = Buffer.from(signature, "hex")
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export async function refundJob(admin: Admin, job: { id: string; generation_id: string }, reason: string) {
  await admin
    .from("claude_jobs")
    .update({ status: "failed", error: reason, finished_at: new Date().toISOString() })
    .eq("id", job.id)
    .in("status", ["queued", "running"])
  const { error } = await admin.rpc("refund_generation", {
    p_generation: job.generation_id,
    p_note: reason.slice(0, 200),
  })
  if (error) console.error("[servicios] refund failed", { job: job.id })
}

export async function runJob(jobId: string): Promise<void> {
  const admin = createSupabaseAdmin()

  // Reclamo atómico: solo una ejecución pasa de "queued" a "running".
  const claimed = await admin
    .from("claude_jobs")
    .update({ status: "running" })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("id, user_id, generation_id, service, input")
    .maybeSingle()
  if (claimed.error || !claimed.data) return
  const job = claimed.data as {
    id: string
    user_id: string
    generation_id: string
    service: string
    input: ServiceInput
  }

  const service = getService(job.service)
  if (!service) {
    await refundJob(admin, job, "Servicio desconocido")
    return
  }

  try {
    const recipe = recipeFor(service.id, job.input)
    let result: Awaited<ReturnType<typeof callTool>> | null = null
    let lastError: unknown = null
    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      try {
        result = await callTool(recipe)
      } catch (caught) {
        lastError = caught
        if (!(caught instanceof ClaudeError) || !caught.retryable) break
        await new Promise((r) => setTimeout(r, 4000))
      }
    }
    if (!result) throw lastError ?? new Error("Sin respuesta")

    const output = normalizeOutput(service.id, result.input)
    if (!output || !isUsable(output)) {
      await refundJob(admin, job, "La respuesta salió incompleta; se devolvieron los créditos")
      return
    }

    if (output.service === "asistente") await saveAssistant(admin, job, output.data)

    const saved = await admin
      .from("claude_jobs")
      .update({
        status: "done",
        output: output.data,
        usage: result.usage,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("status", "running")
    if (saved.error) throw new Error("No se pudo guardar el resultado")

    await admin
      .from("generations")
      .update({ status: "completed", settled_at: new Date().toISOString() })
      .eq("id", job.generation_id)
      .eq("status", "charged")
  } catch (caught) {
    const message =
      caught instanceof ClaudeError ? caught.message : "No se pudo completar el servicio"
    console.error("[servicios] job failed", { job: job.id, message })
    await refundJob(admin, job, `${message}; se devolvieron los créditos`)
  }
}

/** Crea el asistente (o actualiza su ficha si el trabajo era para rehacerla). */
async function saveAssistant(
  admin: Admin,
  job: { id: string; user_id: string; input: ServiceInput },
  data: { ficha: string; saludo: string; preguntas_frecuentes: { pregunta: string; respuesta: string }[] }
) {
  const faq = data.preguntas_frecuentes
    .map((q) => `- **${q.pregunta}** ${q.respuesta}`)
    .join("\n")
  const knowledge = faq ? `${data.ficha}\n\n## Respuestas rápidas\n${faq}` : data.ficha
  const name = typeof job.input.negocio === "string" ? job.input.negocio : "Mi negocio"
  const whatsapp = typeof job.input.whatsapp === "string" ? job.input.whatsapp : null
  const existingId = typeof job.input.assistant_id === "string" ? job.input.assistant_id : null

  if (existingId) {
    const { error } = await admin
      .from("assistants")
      .update({
        knowledge,
        greeting: data.saludo,
        business_name: name,
        whatsapp,
        job_id: job.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingId)
      .eq("user_id", job.user_id)
    if (error) throw new Error("No se pudo actualizar el asistente")
    return
  }

  const base = slugify(name)
  for (let i = 0; i < 6; i++) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { error } = await admin.from("assistants").insert({
      user_id: job.user_id,
      job_id: job.id,
      slug,
      business_name: name,
      whatsapp,
      greeting: data.saludo,
      knowledge,
    })
    if (!error) return
    if (error.code !== "23505") throw new Error("No se pudo crear el asistente")
  }
  throw new Error("No se encontró una dirección libre para el asistente")
}
