import type { getTwilioClient } from "@/lib/twilio-client"
import { REVIEW_LIMIT, type OperationReview } from "@/lib/operation-review"
import { normalizeClosePhone } from "@/features/conversations/lib/normalize-close-phone"

export async function previewCloseConversations(
  participants: string[],
  client: ReturnType<typeof getTwilioClient>,
  signal?: AbortSignal
): Promise<OperationReview> {
  const targets = new Map<string, { id: string; relatedId: null }>()
  let partial = false
  for (const phone of participants) {
    signal?.throwIfAborted()
    const address = normalizeClosePhone(phone)
    if (!address) continue
    const items = await client.conversations.v1.participantConversations.list({
      address,
      pageSize: 50,
      limit: REVIEW_LIMIT + 1,
    })
    signal?.throwIfAborted()
    partial ||= items.length > REVIEW_LIMIT
    for (const item of items.slice(0, REVIEW_LIMIT)) {
      if (
        item.conversationState !== "active" ||
        targets.has(item.conversationSid)
      )
        continue
      if (targets.size === REVIEW_LIMIT) {
        partial = true
        continue
      }
      targets.set(item.conversationSid, {
        id: item.conversationSid,
        relatedId: null,
      })
    }
  }
  return { generatedAt: Date.now(), targets: [...targets.values()], partial }
}
