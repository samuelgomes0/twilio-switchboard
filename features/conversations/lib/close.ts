import { strings } from "@/lib/strings"
import { RETRY_ATTEMPTS, RETRY_DELAY_MS } from "@/lib/constants"
import { sanitizeExternalError } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function sseEvent(
  level: string,
  message: string,
  data?: Record<string, unknown>
): string {
  const payload = JSON.stringify({ level, message, ...(data ?? {}) })
  return `data: ${payload}\n\n`
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number,
  label: string,
  emit: (event: string) => void
): Promise<T | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const safeMessage = sanitizeExternalError(err)
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

export function formatPhoneNumber(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, "")
  return `whatsapp:+55${cleaned}`
}

export async function closeConversations(
  participants: string[],
  client: ReturnType<typeof getTwilioClient>,
  emit: (event: string) => void
): Promise<{ totalClosed: number; totalErrors: number }> {
  let totalClosed = 0
  let totalErrors = 0

  for (let idx = 0; idx < participants.length; idx++) {
    const raw = participants[idx]
    const address = formatPhoneNumber(raw)

    emit(
      sseEvent("info", strings.conversations.close.log.searching(address), {
        progress: { current: idx + 1, total: participants.length },
      })
    )

    const conversations = await withRetry(
      () =>
        client.conversations.v1.participantConversations.list({
          address,
          limit: 1000,
        }),
      RETRY_ATTEMPTS,
      RETRY_DELAY_MS,
      strings.conversations.close.log.searchLabel(address),
      emit
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
      const sid = conv.conversationSid
      const result = await withRetry(
        () =>
          client.conversations.v1
            .conversations(sid)
            .update({ state: "closed" }),
        RETRY_ATTEMPTS,
        RETRY_DELAY_MS,
        strings.conversations.close.log.closeLabel(sid),
        emit
      )

      if (result !== null) {
        totalClosed++
        emit(sseEvent("success", strings.conversations.close.log.closed(sid)))
      } else {
        totalErrors++
      }
    }
  }

  return { totalClosed, totalErrors }
}
