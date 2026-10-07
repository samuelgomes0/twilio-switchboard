import { sseEvent } from "@/lib/sse-event"
import { SSE_HEADERS } from "@/lib/sse-headers"

export type SseEmitter = (event: string) => void

export function createSseResponse(
  request: Request,
  unexpectedErrorMessage: string,
  run: (emit: SseEmitter, signal: AbortSignal) => Promise<void>
): Response {
  const abortController = new AbortController()
  const abort = () => abortController.abort()
  request.signal.addEventListener("abort", abort, { once: true })
  if (request.signal.aborted) abort()

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: string) => {
        if (!abortController.signal.aborted) {
          controller.enqueue(encoder.encode(event))
        }
      }

      try {
        abortController.signal.throwIfAborted()
        await run(emit, abortController.signal)
      } catch {
        emit(
          sseEvent("error", unexpectedErrorMessage, {
            done: true,
            totalErrors: 1,
          })
        )
      } finally {
        request.signal.removeEventListener("abort", abort)
        if (!abortController.signal.aborted) controller.close()
      }
    },
    cancel() {
      abort()
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
