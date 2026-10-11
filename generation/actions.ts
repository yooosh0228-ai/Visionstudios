"use server"

import { createSupabaseAdmin } from "@/lib/supabase/admin"

import { getModel, parseSettings } from "./catalog"
import type { GenerationPlane } from "./catalog/types"
import { generationCost, priceUnit } from "./billing"
import { MissingCredentialsError } from "./credentials"
import { describeFailure, fail, isRetryable } from "./errors"
import type { ActionFailure } from "./errors"
import { createPlatformClient } from "./platform"
import type { GenerationStatus, QueuedGeneration, StatusResult } from "./platform"
import { getSession } from "./session"
import type { Session } from "./session"
import { createSubmissionGuard, isSubmissionId } from "./submissions"
import { toPlatform } from "./to-platform"

export type SubmitResult =
  | { ok: true; queued: QueuedGeneration; balance: number }
  | (ActionFailure & { balance?: number })
export type CancelResult = { ok: true } | ActionFailure

type Admin = ReturnType<typeof createSupabaseAdmin>
type Credentials = { apiKey: string; baseUrl: string }

const submissions = createSubmissionGuard<SubmitResult>()
const TERMINAL_FAILURES = new Set(["failed", "nsfw", "canceled"])

/**
 * Cobra los créditos, valida el plano contra el esquema del modelo y envía a
 * Higgsfield una sola vez. Si Higgsfield rechaza, el cobro se devuelve. Si el
 * envío queda sin confirmar (timeout), el cobro se queda hasta que el dueño lo
 * revise: la solicitud pudo haberse generado.
 */
export async function submitGeneration(
  plane: GenerationPlane,
  submissionId: string
): Promise<SubmitResult> {
  try {
    if (!isSubmissionId(submissionId)) throw new Error("Invalid submission id")
    const session = await getSession()
    if (!session) return notSignedIn()
    const model = getModel(plane.model)
    const parsed: GenerationPlane = {
      ...plane,
      settings: parseSettings(model, plane.settings),
    }
    const { path, body } = toPlatform(parsed)
    const credentials = readCredentials()
    return await submissions.run(session.userId, submissionId, () =>
      chargeAndSubmit(session, parsed, submissionId, path, body, credentials)
    )
  } catch (caught) {
    return describeFailure(caught, "submit")
  }
}

async function chargeAndSubmit(
  session: Session,
  plane: GenerationPlane,
  submissionId: string,
  path: string,
  body: Record<string, unknown>,
  credentials: Credentials
): Promise<SubmitResult> {
  const admin = createSupabaseAdmin()

  let cost = 0
  if (!session.isOwner) {
    const computed = generationCost(
      await readPrice(admin, plane.model),
      plane.settings,
      priceUnit(getModel(plane.model))
    )
    if (computed === null)
      return fail(
        "unpriced",
        "Este modelo todavía no tiene precio. Escoge otro modelo."
      )
    cost = computed
  }

  const begun = await admin.rpc("begin_generation", {
    p_user: session.userId,
    p_submission: submissionId,
    p_model: plane.model,
    p_cost: cost,
  })
  if (begun.error) {
    const message = begun.error.message
    if (message.includes("insufficient_credits"))
      return {
        ...fail(
          "insufficient_credits",
          "No te alcanzan los créditos para esta generación. Recarga para continuar."
        ),
        ...balanceField(await readBalance(admin, session.userId)),
      }
    console.error("[billing] begin_generation failed", { message })
    return fail("platform", "No se pudo registrar el cobro. Intenta de nuevo.")
  }

  const row = begun.data?.[0]
  if (!row) return fail("platform", "No se pudo registrar el cobro. Intenta de nuevo.")
  const generationId = String(row.out_generation_id)
  const balance = Number(row.out_balance)

  // Mismo envío repetido (doble clic, otra pestaña): nunca se cobra dos veces.
  if (row.out_duplicate) {
    if (row.out_request_id)
      return {
        ok: true,
        queued: {
          status: "queued",
          requestId: String(row.out_request_id),
          statusUrl: "",
          cancelUrl: "",
        },
        balance,
      }
    return {
      ...fail(
        "unconfirmed",
        "Esta generación ya se está enviando. Espera unos segundos."
      ),
      balance,
    }
  }

  let queued: QueuedGeneration
  try {
    queued = await createPlatformClient(credentials).submit(path, body)
  } catch (caught) {
    const failure = describeFailure(caught, "submit")
    if (failure.code === "unconfirmed") {
      await rpcQuietly(admin, "mark_unconfirmed", { p_generation: generationId })
      return { ...failure, balance }
    }
    const refunded = await admin.rpc("refund_generation", {
      p_generation: generationId,
      p_note: "No se pudo enviar a Higgsfield",
    })
    return {
      ...failure,
      ...balanceField(refunded.error ? balance : Number(refunded.data)),
    }
  }

  await attachRequest(admin, generationId, queued.requestId)
  return { ok: true, queued, balance }
}

/** Cada solicitud en vuelo, respondida en un solo viaje. Solo se consultan las
    solicitudes de esta cuenta, y cada resultado terminal se liquida aquí: lo
    completado queda cerrado y lo fallido, bloqueado o cancelado se reembolsa. */
export async function getGenerationStatuses(
  data: unknown
): Promise<StatusResult[]> {
  const requestIds = parseRequestIds(data)
  const session = await getSession()
  if (!session)
    return requestIds.map((requestId) => ({
      requestId,
      error: "Inicia sesión para seguir tus generaciones.",
      retryable: true,
    }))

  let client: ReturnType<typeof createPlatformClient>
  try {
    client = createPlatformClient(readCredentials())
  } catch (caught) {
    const failure = describeFailure(caught, "status")
    return requestIds.map((requestId) => ({
      requestId,
      error: failure.message,
      retryable: true,
    }))
  }

  const admin = createSupabaseAdmin()
  const owned = await ownedRequests(admin, session.userId, requestIds)
  return Promise.all(
    requestIds.map(async (requestId): Promise<StatusResult> => {
      if (!owned.has(requestId))
        return {
          requestId,
          error: "Esta generación no pertenece a tu cuenta.",
          retryable: false,
        }
      try {
        const status = await client.status(requestId)
        await settle(admin, session.userId, status)
        return { requestId, status }
      } catch (caught) {
        const failure = describeFailure(caught, "status")
        return {
          requestId,
          error: failure.message,
          retryable: isRetryable(failure.code),
        }
      }
    })
  )
}

/** Cancel must reach the platform; stopping the poll alone would keep the
    generation running. Canceled generations are refunded. */
export async function cancelGeneration(data: unknown): Promise<CancelResult> {
  try {
    const session = await getSession()
    if (!session) return notSignedIn()
    const [requestId] = parseRequestIds(data)
    const admin = createSupabaseAdmin()
    const owned = await ownedRequests(admin, session.userId, [requestId!])
    if (!owned.has(requestId!))
      return fail("not_found", "Esta generación no pertenece a tu cuenta.")
    await createPlatformClient(readCredentials()).cancel(requestId!)
    await rpcQuietly(admin, "refund_by_request", {
      p_user: session.userId,
      p_request: requestId,
      p_note: "Cancelada por el usuario",
    })
    return { ok: true }
  } catch (caught) {
    return describeFailure(caught, "cancel")
  }
}

/** Al volver al estudio: liquida lo que quedó en cola mientras no estaba la
    pestaña abierta, para que un fallo nunca deje créditos cobrados sin motivo. */
export async function reconcileMyGenerations(): Promise<number | null> {
  const session = await getSession()
  if (!session) return null
  const admin = createSupabaseAdmin()
  try {
    const { data } = await admin
      .from("generations")
      .select("request_id")
      .eq("user_id", session.userId)
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(25)
    const ids = (data ?? []).flatMap((row) =>
      typeof row.request_id === "string" ? [row.request_id] : []
    )
    if (ids.length > 0) {
      const client = createPlatformClient(readCredentials())
      await Promise.all(
        ids.map(async (id) => {
          try {
            await settle(admin, session.userId, await client.status(id))
          } catch {
            /* se reintenta en la próxima visita */
          }
        })
      )
    }
  } catch (caught) {
    console.error("[billing] reconcile failed", {
      message: caught instanceof Error ? caught.message : String(caught),
    })
  }
  return readBalance(admin, session.userId)
}

async function settle(
  admin: Admin,
  userId: string,
  status: GenerationStatus
): Promise<void> {
  try {
    if (status.status === "completed") {
      await admin.rpc("complete_by_request", {
        p_user: userId,
        p_request: status.requestId,
      })
    } else if (TERMINAL_FAILURES.has(status.status)) {
      await admin.rpc("refund_by_request", {
        p_user: userId,
        p_request: status.requestId,
        p_note: `Higgsfield: ${status.status}`,
      })
    }
  } catch (caught) {
    console.error("[billing] settle failed", {
      message: caught instanceof Error ? caught.message : String(caught),
    })
  }
}

async function ownedRequests(
  admin: Admin,
  userId: string,
  requestIds: string[]
): Promise<Set<string>> {
  const { data } = await admin
    .from("generations")
    .select("request_id")
    .eq("user_id", userId)
    .in("request_id", requestIds)
  return new Set(
    (data ?? []).flatMap((row) =>
      typeof row.request_id === "string" ? [row.request_id] : []
    )
  )
}

async function readPrice(admin: Admin, modelId: string): Promise<number | null> {
  const { data } = await admin
    .from("model_prices")
    .select("credits")
    .eq("model_id", modelId)
    .maybeSingle()
  return data ? Number(data.credits) : null
}

async function readBalance(admin: Admin, userId: string): Promise<number | null> {
  const { data } = await admin
    .from("accounts")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle()
  return data ? Number(data.credits) : null
}

async function attachRequest(
  admin: Admin,
  generationId: string,
  requestId: string
): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await admin.rpc("attach_request", {
      p_generation: generationId,
      p_request: requestId,
    })
    if (!error) return
  }
  console.error("[billing] attach_request failed", { generationId })
}

async function rpcQuietly(
  admin: Admin,
  fn: string,
  args: Record<string, unknown>
): Promise<void> {
  const { error } = await admin.rpc(fn, args)
  if (error) console.error("[billing] rpc failed", { fn, message: error.message })
}

function balanceField(balance: number | null | undefined): { balance?: number } {
  return typeof balance === "number" && Number.isFinite(balance) ? { balance } : {}
}

function notSignedIn(): ActionFailure {
  return fail("not_signed_in", "Tu sesión terminó. Entra de nuevo para generar.")
}

function readCredentials(): Credentials {
  const apiKey = process.env.HF_API_KEY
  if (!apiKey) throw new MissingCredentialsError()
  const baseUrl = process.env.HF_API_BASE_URL
  if (!baseUrl) throw new Error("Missing HF_API_BASE_URL")
  return { apiKey, baseUrl }
}

function parseRequestIds(data: unknown): string[] {
  const payload = asObject(data, "Invalid status payload")
  const requestIds = payload.requestIds
  if (
    !Array.isArray(requestIds) ||
    requestIds.length === 0 ||
    requestIds.length > 100
  ) {
    throw new Error("Invalid request ids")
  }
  return requestIds.map((requestId) => {
    if (typeof requestId !== "string" || !requestId)
      throw new Error("Invalid request id")
    return requestId
  })
}

function asObject(data: unknown, message: string): Record<string, unknown> {
  if (data === null || typeof data !== "object" || Array.isArray(data))
    throw new Error(message)
  return data as Record<string, unknown>
}
