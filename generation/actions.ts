"use server"

import { cookies } from "next/headers"

import { getModel, parseSettings } from "./catalog"
import type { GenerationPlane } from "./catalog/types"
import {
  MissingCredentialsError,
  PLATFORM_KEY_COOKIE,
  PLATFORM_KEY_COOKIE_OPTIONS,
  decodeCredentials,
  encodeCredentials,
  parseCredentialInput,
} from "./credentials"
import { describeFailure, isRetryable } from "./errors"
import type { ActionFailure } from "./errors"
import { createPlatformClient } from "./platform"
import type { QueuedGeneration, StatusResult } from "./platform"
import { createSubmissionGuard, isSubmissionId } from "./submissions"
import { toPlatform } from "./to-platform"

export type SubmitResult =
  { ok: true; queued: QueuedGeneration } | ActionFailure
export type CancelResult = { ok: true } | ActionFailure

const submissions = createSubmissionGuard<SubmitResult>()

export async function savePlatformCredentials(data: unknown) {
  const { apiKey } = parseCredentialInput(data)
  const jar = await cookies()
  jar.set(
    PLATFORM_KEY_COOKIE,
    encodeCredentials(apiKey),
    PLATFORM_KEY_COOKIE_OPTIONS
  )
}

export async function clearPlatformCredentials() {
  const jar = await cookies()
  jar.set(PLATFORM_KEY_COOKIE, "", {
    ...PLATFORM_KEY_COOKIE_OPTIONS,
    maxAge: 0,
  })
}

export async function hasPlatformCredentials() {
  return (await readStoredCredentials()) !== null
}

/** Validates the plane against the model's schema, then POSTs it once. The
    platform POST is never retried: a timeout is reported as unconfirmed so the
    user can check before paying for a second generation. */
export async function submitGeneration(
  plane: GenerationPlane,
  submissionId: string
): Promise<SubmitResult> {
  try {
    if (!isSubmissionId(submissionId)) throw new Error("Invalid submission id")
    const model = getModel(plane.model)
    const parsed: GenerationPlane = {
      ...plane,
      settings: parseSettings(model, plane.settings),
    }
    const { path, body } = toPlatform(parsed)
    const credentials = await readCredentials()
    return await submissions.run(
      await keyScope(credentials.apiKey),
      submissionId,
      async (): Promise<SubmitResult> => {
        try {
          const queued = await createPlatformClient(credentials).submit(
            path,
            body
          )
          return { ok: true, queued }
        } catch (caught) {
          return describeFailure(caught, "submit")
        }
      }
    )
  } catch (caught) {
    return describeFailure(caught, "submit")
  }
}

/** Every request in flight, answered in one round trip. Next dispatches server
    actions one at a time per client, so a poll per run would queue ahead of the
    next submit — the fan-out belongs on this side of the call, where it is
    genuinely parallel. */
export async function getGenerationStatuses(
  data: unknown
): Promise<StatusResult[]> {
  const requestIds = parseRequestIds(data)
  let client: ReturnType<typeof createPlatformClient>
  try {
    client = createPlatformClient(await readCredentials())
  } catch (caught) {
    // No key right now (removed, expired cookie): keep the runs waiting. They
    // resume once a key is saved again, or time out on their deadline.
    const failure = describeFailure(caught, "status")
    return requestIds.map((requestId) => ({
      requestId,
      error: failure.message,
      retryable: true,
    }))
  }
  return Promise.all(
    requestIds.map(async (requestId): Promise<StatusResult> => {
      try {
        return { requestId, status: await client.status(requestId) }
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
    generation running (and billed). */
export async function cancelGeneration(data: unknown): Promise<CancelResult> {
  try {
    const [requestId] = parseRequestIds(data)
    await createPlatformClient(await readCredentials()).cancel(requestId!)
    return { ok: true }
  } catch (caught) {
    return describeFailure(caught, "cancel")
  }
}

async function readStoredCredentials() {
  const jar = await cookies()
  return decodeCredentials(jar.get(PLATFORM_KEY_COOKIE)?.value)
}

async function readCredentials() {
  const stored = await readStoredCredentials()
  if (!stored) throw new MissingCredentialsError()
  const baseUrl = process.env.HF_API_BASE_URL
  if (!baseUrl) throw new Error("Missing HF_API_BASE_URL")
  return { ...stored, baseUrl }
}

/** Opaque per-key scope for the submission guard; the key itself is never stored. */
async function keyScope(apiKey: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(apiKey)
  )
  return Buffer.from(digest).toString("base64url")
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
