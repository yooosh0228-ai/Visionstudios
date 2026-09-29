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

export type ActionFailure = { ok: false; code: FailureCode; message: string }

export function describeFailure(
  error: unknown,
  context: "submit" | "status" | "cancel" | "upload" = "submit"
): ActionFailure {
  if (error instanceof MissingCredentialsError)
    return fail("missing_key", "Connect your Higgsfield API key to generate.")

  if (error instanceof PlatformError) {
    const detail = platformDetail(error.body)
    if (error.status === 401 || error.status === 403)
      return fail(
        "invalid_key",
        "Higgsfield rejected this API key. Replace it from the sidebar with a key from open.higgsfield.ai."
      )
    if (error.status === 429)
      return fail(
        "rate_limited",
        "Higgsfield rate limit reached. Wait a moment, then try again."
      )
    if (error.status === 404)
      return fail(
        "not_found",
        detail ??
          (context === "submit"
            ? "Higgsfield does not recognise this model endpoint."
            : "Higgsfield no longer knows this request.")
      )
    if (error.status >= 400 && error.status < 500) {
      if (context === "cancel")
        return fail(
          "invalid_input",
          detail ??
            "This generation has already started processing and can no longer be canceled."
        )
      return fail(
        "invalid_input",
        detail ?? `Higgsfield refused the request (${error.status}).`
      )
    }
    return fail(
      "platform",
      detail ??
        `Higgsfield is having trouble (${error.status}). Try again shortly.`
    )
  }

  if (isNetworkError(error)) {
    if (context === "submit")
      return fail(
        "unconfirmed",
        "Could not confirm the submission with Higgsfield. It may still have been queued, so check your Higgsfield history before generating again."
      )
    return fail("platform", "Could not reach Higgsfield. Check the connection.")
  }

  // Validation from the catalog (parseSettings / toPlatform) and credential
  // parsing throw plain errors with user-facing messages.
  if (error instanceof Error && error.message)
    return fail("invalid_input", error.message)
  return fail("platform", "Something went wrong talking to Higgsfield.")
}

/** Failures worth polling through: the run may still finish on the platform. */
export function isRetryable(code: FailureCode): boolean {
  return code !== "not_found" && code !== "invalid_input"
}

function fail(code: FailureCode, message: string): ActionFailure {
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
