import type {
  ConversationHistoryResponse,
  ConversationMedia,
} from "@/features/conversations/types"
import { getTwilioClient } from "@/lib/twilio-client"

const MESSAGE_HISTORY_LIMIT = 1000

function readMediaString(media: unknown, key: string): string | null {
  if (typeof media !== "object" || media === null) return null
  const value = (media as Record<string, unknown>)[key]
  return typeof value === "string" ? value : null
}

function normalizeMedia(media: unknown): ConversationMedia {
  const sizeValue =
    typeof media === "object" && media !== null
      ? (media as Record<string, unknown>).size
      : null

  return {
    sid: readMediaString(media, "sid"),
    filename: readMediaString(media, "filename"),
    contentType: readMediaString(media, "content_type"),
    size: typeof sizeValue === "number" ? sizeValue : null,
  }
}

export async function fetchConversationHistory(
  sid: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<ConversationHistoryResponse> {
  const conversation = await client.conversations.v1.conversations(sid).fetch()
  const fetchedMessages = await client.conversations.v1
    .conversations(sid)
    .messages.list({
      order: "desc",
      pageSize: 100,
      limit: MESSAGE_HISTORY_LIMIT + 1,
    })
  const hasMore = fetchedMessages.length > MESSAGE_HISTORY_LIMIT
  const messages = fetchedMessages.slice(0, MESSAGE_HISTORY_LIMIT).reverse()

  return {
    conversation: {
      sid: conversation.sid,
      friendlyName: conversation.friendlyName,
      state: conversation.state,
    },
    messages: messages.map((message) => ({
      sid: message.sid,
      index: message.index,
      author: message.author,
      body: message.body,
      participantSid: message.participantSid ?? null,
      dateCreated: message.dateCreated ?? null,
      dateUpdated: message.dateUpdated ?? null,
      attributes: message.attributes,
      media: Array.isArray(message.media)
        ? message.media.map(normalizeMedia)
        : [],
    })),
    hasMore,
  }
}
