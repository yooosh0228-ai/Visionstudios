"use server"

import { createSupabaseAdmin } from "@/lib/supabase/admin"

import { MODELS } from "./catalog"
import { parseCreditAmount, parsePriceInput } from "./billing"
import { getSession } from "./session"

export type AdminResult =
  { ok: true; balance?: number } | { ok: false; message: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOwner(): Promise<void> {
  const session = await getSession()
  if (!session?.isOwner) throw new Error("Solo el dueño puede hacer esto.")
}

/** Recarga (monto positivo) o descuento (negativo) en la cuenta de un cliente. */
export async function adjustCredits(data: unknown): Promise<AdminResult> {
  try {
    await requireOwner()
    const input = asObject(data)
    const userId = asUuid(input.userId)
    const amount = parseCreditAmount(input.credits, { allowNegative: true })
    const note = cleanNote(input.note)
    const { data: balance, error } = await createSupabaseAdmin().rpc(
      "admin_adjust",
      {
        p_user: userId,
        p_delta: amount,
        p_reason: amount > 0 ? "topup" : "adjustment",
        p_note: note,
      }
    )
    if (error)
      return {
        ok: false,
        message: error.message.includes("negative_balance")
          ? "El saldo no puede quedar en negativo."
          : "No se pudo aplicar el movimiento.",
      }
    return { ok: true, balance: Number(balance) }
  } catch (caught) {
    return failure(caught)
  }
}

/** Fija el precio de un modelo en créditos. Vacío lo quita: los clientes dejan de poder usarlo. */
export async function setModelPrice(data: unknown): Promise<AdminResult> {
  try {
    await requireOwner()
    const input = asObject(data)
    const modelId = input.modelId
    if (typeof modelId !== "string" || !MODELS.some((m) => m.id === modelId))
      throw new Error("Modelo desconocido")
    const price = parsePriceInput(input.credits)
    const admin = createSupabaseAdmin()
    const { error } =
      price === null
        ? await admin.from("model_prices").delete().eq("model_id", modelId)
        : await admin.from("model_prices").upsert({
            model_id: modelId,
            credits: price,
            updated_at: new Date().toISOString(),
          })
    if (error) return { ok: false, message: "No se pudo guardar el precio." }
    return { ok: true }
  } catch (caught) {
    return failure(caught)
  }
}

/** Devuelve el cobro de una generación que quedó sin confirmar. */
export async function refundStuckGeneration(data: unknown): Promise<AdminResult> {
  try {
    await requireOwner()
    const generationId = asUuid(asObject(data).generationId)
    const admin = createSupabaseAdmin()
    const { data: row } = await admin
      .from("generations")
      .select("status")
      .eq("id", generationId)
      .maybeSingle()
    if (!row || !["charged", "unconfirmed"].includes(String(row.status)))
      return { ok: false, message: "Esta generación ya no está pendiente." }
    const { error } = await admin.rpc("refund_generation", {
      p_generation: generationId,
      p_note: "Devuelto por el dueño",
    })
    if (error) return { ok: false, message: "No se pudo devolver el cobro." }
    return { ok: true }
  } catch (caught) {
    return failure(caught)
  }
}

function asObject(data: unknown): Record<string, unknown> {
  if (data === null || typeof data !== "object" || Array.isArray(data))
    throw new Error("Solicitud inválida")
  return data as Record<string, unknown>
}

function asUuid(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value))
    throw new Error("Cuenta inválida")
  return value
}

function cleanNote(value: unknown): string | null {
  if (typeof value !== "string") return null
  const note = value.trim().slice(0, 200)
  return note || null
}

function failure(caught: unknown): AdminResult {
  return {
    ok: false,
    message: caught instanceof Error ? caught.message : "Algo salió mal.",
  }
}
