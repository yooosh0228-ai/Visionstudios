import { MissingCredentialsError } from "./credentials"
import { PlatformError } from "./platform"

/**
 * Failures the studio can act on. Server actions return these instead of
 * throwing: Next.js replaces thrown server-action messages with a generic
 * error in production, so a thrown "invalid key" would never reach the dock.
 */
export type FailureCode =
  | "missing_key"
  | "invalid_key"
  | "rate_limited"
  | "invalid_input"
  | "not_found"
  | "unconfirmed"
  | "platform"
  | "not_signed_in"
  | "insufficient_credits"
  | "unpriced"

export type ActionFailure = { ok: false; code: FailureCode; message: string }

export function describeFailure(
  error: unknown,
  context: "submit" | "status" | "cancel" | "upload" = "submit"
): ActionFailure {
  if (error instanceof MissingCredentialsError)
    return fail(
      "missing_key",
      "El estudio no está conectado a Higgsfield todavía. Avísale al administrador."
    )

  if (error instanceof PlatformError) {
    const detail = platformDetail(error.body)
    if (error.status === 401 || error.status === 403)
      return fail(
        "invalid_key",
        "Higgsfield rechazó la llave del estudio. Avísale al administrador."
      )
    if (error.status === 429)
      return fail(
        "rate_limited",
        "Higgsfield está recibiendo muchas solicitudes. Espera un momento y vuelve a intentar."
      )
    if (error.status === 404)
      return fail(
        "not_found",
        detail ??
          (context === "submit"
            ? "Higgsfield no reconoce este modelo."
            : "Higgsfield ya no conoce esta solicitud.")
      )
    if (error.status >= 400 && error.status < 500) {
      if (context === "cancel")
        return fail(
          "invalid_input",
          detail ??
            "Esta generación ya empezó a procesarse y no se puede cancelar."
        )
      return fail(
        "invalid_input",
        detail ?? `Higgsfield rechazó la solicitud (${error.status}).`
      )
    }
    return fail(
      "platform",
      detail ??
        `Higgsfield está teniendo problemas (${error.status}). Intenta de nuevo en un momento.`
    )
  }

  if (isNetworkError(error)) {
    if (context === "submit")
      return fail(
        "unconfirmed",
        "No pudimos confirmar el envío a Higgsfield. Puede que sí se haya generado: escríbenos antes de intentarlo otra vez y lo revisamos."
      )
    return fail("platform", "No se pudo conectar con Higgsfield. Revisa tu conexión.")
  }

  // Validation from the catalog (parseSettings / toPlatform) throws plain
  // errors with user-facing messages.
  if (error instanceof Error && error.message)
    return fail("invalid_input", error.message)
  return fail("platform", "Algo salió mal al hablar con Higgsfield.")
}

/** Failures worth polling through: the run may still finish on the platform. */
export function isRetryable(code: FailureCode): boolean {
  return code !== "not_found" && code !== "invalid_input"
}

export function fail(code: FailureCode, message: string): ActionFailure {
  return { ok: false, code, message }
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    (error instanceof TypeError && /fetch|network/i.test(error.message))
  )
}

/** `detail` is a string on most errors and a list of field errors on
    validation failures (`[{ loc, msg }]`). */
function platformDetail(body: unknown): string | undefined {
  if (body === null || typeof body !== "object") return undefined
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === "string" && detail) return detail
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item) => {
      if (item === null || typeof item !== "object") return []
      const { msg, loc } = item as { msg?: unknown; loc?: unknown }
      if (typeof msg !== "string") return []
      const field = Array.isArray(loc)
        ? loc.filter((p) => p !== "body").join(".")
        : ""
      return [field ? `${field}: ${msg}` : msg]
    })
    if (messages.length) return messages.join("; ")
  }
  return undefined
}
