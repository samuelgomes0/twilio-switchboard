import { getTwilioClient } from "@/lib/twilio-client"

export interface ParticipantConversation {
  conversationSid: string
  conversationState: string
  conversationDateCreated: Date | null
  conversationDateUpdated: Date | null
  conversationFriendlyName: string | null
  participantSid: string
  participantIdentity: string | null
  participantMessagingBinding: Record<string, unknown> | null
}

export async function fetchConversationsByParticipant(
  address: string,
  client: ReturnType<typeof getTwilioClient>
): Promise<ParticipantConversation[]> {
  const results = await client.conversations.v1.participantConversations.list({
    address,
    limit: 50,
  })

  return results.map((pc) => ({
    conversationSid: pc.conversationSid,
    conversationState: pc.conversationState as string,
    conversationDateCreated: pc.conversationDateCreated ?? null,
    conversationDateUpdated: pc.conversationDateUpdated ?? null,
    conversationFriendlyName: pc.conversationFriendlyName ?? null,
    participantSid: pc.participantSid,
    participantIdentity: pc.participantIdentity ?? null,
    participantMessagingBinding:
      (pc.participantMessagingBinding as Record<string, unknown> | null) ?? null,
  }))
}
