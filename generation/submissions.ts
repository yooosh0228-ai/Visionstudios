/**
 * Server-side guard against duplicate generation submits. Each Generate click
 * carries a fresh submission id; a repeat of the same id (double click, a
 * replayed action, a second tab racing the first) gets the original answer
 * instead of a second paid generation. Scoped per API key so one user's id can
 * never read another's result. In-memory: this covers one server process,
 * which is what `next start` runs; a multi-instance deploy needs a shared store.
 */
const TTL_MS = 10 * 60_000
const SUBMISSION_ID = /^[A-Za-z0-9-]{16,64}$/

type Entry<T> = { expires: number; result: Promise<T> }

export function createSubmissionGuard<T>(now: () => number = Date.now) {
  const entries = new Map<string, Entry<T>>()

  function prune() {
    const t = now()
    for (const [key, entry] of entries)
      if (entry.expires <= t) entries.delete(key)
  }

  return {
    /** Runs `submit` once per (scope, id); later calls share its result. */
    run(
      scope: string,
      submissionId: string,
      submit: () => Promise<T>
    ): Promise<T> {
      prune()
      const key = `${scope}:${submissionId}`
      const existing = entries.get(key)
      if (existing) return existing.result
      const result = submit()
      entries.set(key, { expires: now() + TTL_MS, result })
      return result
    },
    size: () => entries.size,
  }
}

export function isSubmissionId(value: unknown): value is string {
  return typeof value === "string" && SUBMISSION_ID.test(value)
}
