import type { CloseConversationResult } from "@/features/conversations/types"
import type { getTwilioClient } from "@/lib/twilio-client"
import { strings } from "@/lib/strings"
import { toIsoString } from "@/lib/to-iso-string"

export async function closeConversation(
  sid: string,
  client: ReturnType<typeof getTwilioClient>,
  signal: AbortSignal
): Promise<CloseConversationResult | { error: string }> {
  try {
    signal.throwIfAborted()
    const resource = client.conversations.v1.conversations(sid)
    const current = await resource.fetch()
    signal.throwIfAborted()
    if (current.state !== "active") {
      return {
        sid: current.sid,
        state: current.state,
        dateUpdated: toIsoString(current.dateUpdated),
        closed: false,
      }
    }
    // Twilio has no conditional state update; check immediately before the single write.
    const updated = await resource.update({ state: "closed" })
    return {
      sid: updated.sid,
      state: updated.state,
      dateUpdated: toIsoString(updated.dateUpdated),
      closed: true,
    }
  } catch {
    return { error: strings.conversations.closeSingle.error }
  }
}
