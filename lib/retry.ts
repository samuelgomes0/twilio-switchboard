import { sanitizeExternalError } from "@/lib/errors"
import { sseEvent } from "@/lib/sse-event"
import { strings } from "@/lib/strings"

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number,
  label: string,
  emit: (event: string) => void,
  signal?: AbortSignal
): Promise<T | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    signal?.throwIfAborted()
    try {
      return await fn()
    } catch (error) {
      if (signal?.aborted) throw error
      const safeMessage = sanitizeExternalError(error)
      if (attempt < attempts) {
        emit(
          sseEvent(
            "warning",
            strings.common.retry.attemptFailed(label, attempt, safeMessage)
          )
        )
        await sleep(delayMs)
      } else {
        emit(
          sseEvent(
            "error",
            strings.common.retry.failed(label, attempts, safeMessage)
          )
        )
      }
    }
  }
  return null
}
