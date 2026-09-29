import { getGenerationStatuses } from "./actions"
import type { GenerationStatus, StatusResult } from "./platform"

/** Statuses the platform never moves off again. */
const TERMINAL = new Set(["completed", "failed", "nsfw", "canceled"])

export const POLL_INTERVAL_MS = 4000
/** Backoff ceiling while rounds keep failing (rate limit, network, outage). */
const MAX_INTERVAL_MS = 30_000
export const POLL_DEADLINE_MS = 10 * 60_000
/** Rounds allowed to fail back to back before the watches are given up on. One
    dropped round must not end every generation in flight; with backoff this is
    a couple of minutes of failures. */
const MAX_MISSES = 6

/** The last transient error per request, reported if its deadline passes. */
const lastErrors = new Map<string, string>()

type Waiter = {
  deadline: number
  resolve: (status: GenerationStatus) => void
  reject: (reason: Error) => void
}

const waiting = new Map<string, Waiter>()
const inflight = new Map<string, Promise<GenerationStatus>>()
let timer: ReturnType<typeof setTimeout> | null = null
let polling = false
let misses = 0
/** Rounds whose server action itself failed, back to back. */
let dropped = 0

/** Resolves when the platform reports a terminal status for this request.
    Every request in flight is asked for together, in one server action per
    interval: Next dispatches server actions one at a time per client, so a
    poll per run would queue ahead of the next submit and the composer would
    stall again — with the lock gone and the queue doing the same work. */
export function watchRequest(
  requestId: string,
  opts?: { deadline?: number }
): Promise<GenerationStatus> {
  const existing = inflight.get(requestId)
  if (existing) return existing
  const promise = new Promise<GenerationStatus>((resolve, reject) => {
    waiting.set(requestId, {
      deadline: opts?.deadline ?? Date.now() + POLL_DEADLINE_MS,
      resolve: (status) => {
        inflight.delete(requestId)
        resolve(status)
      },
      reject: (reason) => {
        inflight.delete(requestId)
        reject(reason)
      },
    })
    schedule()
  })
  inflight.set(requestId, promise)
  return promise
}

/** Drops every watch without settling it: the studio unmounted and there is
    nobody left to hand a result to. In-flight jobs stay in history and the
    next mount starts a fresh watch. */
export function stopWatching(): void {
  if (timer !== null) clearTimeout(timer)
  timer = null
  misses = 0
  dropped = 0
  waiting.clear()
  inflight.clear()
  lastErrors.clear()
}

function schedule(): void {
  if (timer !== null || polling || waiting.size === 0) return
  timer = setTimeout(() => void round(), nextInterval(misses))
}

async function round(): Promise<void> {
  timer = null
  polling = true
  try {
    const results = await getGenerationStatuses({
      requestIds: [...waiting.keys()],
    })
    let transient = false
    for (const result of results) transient = deliver(result) || transient
    misses = transient ? misses + 1 : 0
    dropped = 0
    sweep()
  } catch {
    misses++
    if (++dropped < MAX_MISSES) return
    settleAll(
      new Error(
        "Lost contact with the studio server while checking progress. The generation may still finish on Higgsfield."
      )
    )
  } finally {
    polling = false
    schedule()
  }
}

/** Exponential backoff after failed rounds, capped. */
export function nextInterval(failedRounds: number): number {
  return Math.min(POLL_INTERVAL_MS * 2 ** failedRounds, MAX_INTERVAL_MS)
}

/** Returns true when the answer was a transient failure worth backing off for. */
function deliver(result: StatusResult): boolean {
  const waiter = waiting.get(result.requestId)
  if (!waiter) return false
  if ("error" in result) {
    if (result.retryable) {
      lastErrors.set(result.requestId, result.error)
      return true
    }
    waiting.delete(result.requestId)
    lastErrors.delete(result.requestId)
    waiter.reject(new Error(result.error))
    return false
  }
  lastErrors.delete(result.requestId)
  if (!TERMINAL.has(result.status.status)) return false
  waiting.delete(result.requestId)
  waiter.resolve(result.status)
  return false
}

/* A run the platform never finishes would otherwise hold its skeleton open for
   the rest of the session. */
function sweep(): void {
  const now = Date.now()
  for (const [requestId, waiter] of [...waiting]) {
    if (now <= waiter.deadline) continue
    waiting.delete(requestId)
    const last = lastErrors.get(requestId)
    lastErrors.delete(requestId)
    waiter.reject(
      new Error(
        last
          ? `Stopped checking: ${last}`
          : "Stopped waiting: the generation did not finish in time. It may still complete on Higgsfield."
      )
    )
  }
}

function settleAll(reason: Error): void {
  const waiters = [...waiting.values()]
  waiting.clear()
  misses = 0
  dropped = 0
  lastErrors.clear()
  for (const waiter of waiters) waiter.reject(reason)
}
