import { strings } from "@/lib/strings"
import { RETRY_ATTEMPTS, RETRY_DELAY_MS } from "@/lib/constants"
import { sanitizeExternalError } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { normalizeClosePhone } from "@/features/conversations/lib/normalize-close-phone"
export { sseEvent } from "@/lib/sse-event"
import { sseEvent } from "@/lib/sse-event"
export { sleep, withRetry } from "@/lib/retry"
import { withRetry } from "@/lib/retry"

export async function closeConversations(
  participants: string[],
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void,
  signal?: AbortSignal
): Promise<{ totalClosed: number; totalErrors: number }> {
  let totalClosed = 0
  let totalErrors = 0

  for (let idx = 0; idx < participants.length; idx++) {
    signal?.throwIfAborted()
    const raw = participants[idx]
    const address = normalizeClosePhone(raw)
    if (address === null) {
      totalErrors++
      emit(sseEvent("error", strings.conversations.close.invalidPhone))
      continue
    }

    emit(
      sseEvent("info", strings.conversations.close.log.searching(address), {
        progress: { current: idx + 1, total: participants.length },
      })
    )

    const conversations = await withRetry(
      () =>
        client.conversations.v1.participantConversations.list({
          address,
          // Active conversations can appear after any number of closed ones.
          pageSize: 50,
        }),
      RETRY_ATTEMPTS,
      RETRY_DELAY_MS,
      strings.conversations.close.log.searchLabel(address),
      emit,
      signal
    )

    if (conversations === null) {
      totalErrors++
      continue
    }

    const active = conversations.filter((c) => c.conversationState === "active")

    if (active.length === 0) {
      emit(
        sseEvent("warning", strings.conversations.close.log.noActive(address))
      )
      continue
    }

    emit(
      sseEvent(
        "info",
        strings.conversations.close.log.found(active.length, address)
      )
    )

    for (const conv of active) {
      signal?.throwIfAborted()
      const sid = conv.conversationSid
      try {
        await client.conversations.v1
          .conversations(sid)
          .update({ state: "closed" })
        totalClosed++
        emit(sseEvent("success", strings.conversations.close.log.closed(sid)))
      } catch (error) {
        if (signal?.aborted) throw error
        totalErrors++
        emit(
          sseEvent(
            "error",
            strings.common.retry.failed(
              strings.conversations.close.log.closeLabel(sid),
              1,
              sanitizeExternalError(error)
            )
          )
        )
      }
    }
  }

  return { totalClosed, totalErrors }
}
