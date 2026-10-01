"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { cancelGeneration, submitGeneration } from "@/generation/actions"
import type { ActionFailure } from "@/generation/errors"
import { getModel } from "@/generation/catalog"
import type { GenerationPlane } from "@/generation/catalog"
import type { GenerationStatus } from "@/generation/platform"
import { stopWatching, watchRequest } from "@/generation/poll"
import { useAccount } from "@/generation/stores/account"

import {
  aspectFromSettings,
  loadHistory,
  saveHistory,
  type RunRecord,
} from "./history"

/**
 * The studio's generation controller: submits planes to the platform through
 * the server action, keeps every run in IndexedDB-backed history, and resumes
 * polls for runs that were still in flight when the page reloaded.
 */
export function useRuns() {
  const [records, setRecords] = useState<RunRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  /** Synchronous single-flight lock: state updates land too late to stop a
      double click from sending two submits. */
  const inFlight = useRef(false)

  const update = useCallback((id: string, patch: Partial<RunRecord>) => {
    setRecords((current) =>
      current.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
  }, [])

  const watch = useCallback(
    (record: RunRecord) => {
      watchRequest(record.requestId, {
        deadline: record.createdAt + 15 * 60_000,
      })
        .then((status) => {
          update(record.id, settle(status))
          void useAccount.getState().refresh()
        })
        .catch((caught: unknown) => {
          update(record.id, {
            status: "failed",
            error: caught instanceof Error ? caught.message : String(caught),
          })
        })
    },
    [update]
  )

  useEffect(() => {
    let alive = true
    void loadHistory().then((stored) => {
      if (!alive) return
      setRecords(stored)
      setLoaded(true)
      for (const record of stored)
        if (record.status === "running") watch(record)
    })
    return () => {
      alive = false
      stopWatching()
    }
  }, [watch])

  useEffect(() => {
    if (loaded) void saveHistory(records)
  }, [loaded, records])

  const submit = useCallback(
    async (
      plane: GenerationPlane,
      projectId?: string
    ): Promise<
      | { record: RunRecord; failure: null }
      | { record: null; failure: ActionFailure | null }
    > => {
      if (inFlight.current) return { record: null, failure: null }
      inFlight.current = true
      setSubmitting(true)
      setError(null)
      const model = getModel(plane.model)
      try {
        const result = await submitGeneration(plane, crypto.randomUUID())
        if (typeof result.balance === "number")
          useAccount.getState().setCredits(result.balance)
        if (!result.ok) {
          setError(result.message)
          return { record: null, failure: result }
        }
        const { queued } = result
        const record: RunRecord = {
          id: queued.requestId,
          requestId: queued.requestId,
          surface: model.surface,
          modelId: model.id,
          modelLabel: model.label,
          prompt: plane.prompt.text,
          settings: plane.settings,
          ...(projectId ? { projectId } : {}),
          aspect: aspectFromSettings(plane.settings),
          status: "running",
          urls: [],
          createdAt: Date.now(),
        }
        setRecords((current) =>
          current.some((r) => r.id === record.id)
            ? current
            : [record, ...current]
        )
        watch(record)
        return { record, failure: null }
      } catch {
        // The server action itself failed (network drop, server restart): the
        // POST may or may not have reached Higgsfield, so never resend it.
        const failure: ActionFailure = {
          ok: false,
          code: "unconfirmed",
          message:
            "No pudimos confirmar el envío. Puede que sí se haya generado: escríbenos antes de intentarlo otra vez y lo revisamos.",
        }
        setError(failure.message)
        return { record: null, failure }
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    },
    [watch]
  )

  const cancel = useCallback(
    async (id: string): Promise<ActionFailure | null> => {
      const record = records.find((r) => r.id === id)
      if (!record || record.status !== "running") return null
      let result: Awaited<ReturnType<typeof cancelGeneration>>
      try {
        result = await cancelGeneration({ requestIds: [record.requestId] })
      } catch {
        result = {
          ok: false,
          code: "platform",
          message: "No se pudo contactar al estudio para cancelar. Intenta de nuevo.",
        }
      }
      if (result.ok) {
        update(id, { status: "failed", error: "Cancelada" })
        void useAccount.getState().refresh()
        return null
      }
      setError(result.message)
      return result
    },
    [records, update]
  )

  const remove = useCallback((id: string) => {
    setRecords((current) => current.filter((r) => r.id !== id))
  }, [])

  const running = records.filter((r) => r.status === "running")

  return {
    records,
    running,
    loaded,
    error,
    submitting,
    submit,
    cancel,
    remove,
    setError,
  }
}

function settle(status: GenerationStatus): Partial<RunRecord> {
  const urls = [
    ...(status.images?.map((i) => i.url) ?? []),
    ...(status.video ? [status.video.url] : []),
  ]
  if (status.status === "completed" && urls.length > 0)
    return { status: "completed", urls }
  const reason =
    status.status === "nsfw"
      ? "Blocked by the content filter"
      : status.status === "canceled"
        ? "Canceled"
        : (describeError(status.error) ??
          "The generation did not produce media")
  return { status: "failed", error: reason }
}

function describeError(error: unknown): string | undefined {
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const detail =
      (error as { detail?: unknown; message?: unknown }).detail ??
      (error as { message?: unknown }).message
    if (typeof detail === "string") return detail
  }
  return undefined
}
