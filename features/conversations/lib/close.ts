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
            `${label}: tentativa ${attempt} falhou: ${safeMessage}. Tentando novamente...`
          )
        )
        await sleep(delayMs)
      } else {
        console.error(
          `[withRetry] ${label}: falhou após ${attempts} tentativas`,
          err
        )
        emit(
          sseEvent(
            "error",
            `${label}: falhou após ${attempts} tentativas: ${safeMessage}`
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
      sseEvent("info", `Buscando conversas para ${address}...`, {
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
      `Busca de conversas (${address})`,
      emit
    )

    if (conversations === null) {
      totalErrors++
      continue
    }

    const active = conversations.filter((c) => c.conversationState === "active")

    if (active.length === 0) {
      emit(
        sseEvent("warning", `Nenhuma conversa ativa encontrada para ${address}`)
      )
      continue
    }

    emit(
      sseEvent(
        "info",
        `${active.length} conversa(s) ativa(s) encontrada(s) para ${address}`
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
        `Fechar conversa ${sid}`,
        emit
      )

      if (result !== null) {
        totalClosed++
        emit(sseEvent("success", `Conversa ${sid} fechada com sucesso`))
      } else {
        totalErrors++
      }
    }
  }

  return { totalClosed, totalErrors }
}
