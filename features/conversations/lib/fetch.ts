import { getTwilioClient } from "@/lib/twilio-client"
import { type FetchResponse } from "@/features/conversations/types"
import { toIsoString } from "@/lib/to-iso-string"

export async function fetchConversation(
  sid: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<FetchResponse> {
  const [conversation, participants] = await Promise.all([
    client.conversations.v1.conversations(sid).fetch(),
    client.conversations.v1
      .conversations(sid)
      .participants.list({ limit: 200 }),
  ])

  return {
    conversation: {
      sid: conversation.sid,
      friendlyName: conversation.friendlyName,
      state: conversation.state,
      dateCreated: toIsoString(conversation.dateCreated),
      dateUpdated: toIsoString(conversation.dateUpdated),
      attributes: conversation.attributes,
      messagingServiceSid: conversation.messagingServiceSid,
      url: conversation.url,
      timers: conversation.timers,
    },
    participants: participants.map((p) => ({
      sid: p.sid,
      identity: p.identity,
      messagingBinding: p.messagingBinding,
      dateCreated: toIsoString(p.dateCreated),
      dateUpdated: toIsoString(p.dateUpdated),
      attributes: p.attributes,
      roleSid: p.roleSid,
    })),
  }
}
