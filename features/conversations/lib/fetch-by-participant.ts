import { getTwilioClient } from "@/lib/twilio-client"
import { sortParticipantConversations } from "@/features/conversations/lib/search-participant-pages"

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

export interface ParticipantConversationPage {
  conversations: ParticipantConversation[]
  nextPageToken: string | null
}

const PARTICIPANT_CONVERSATION_PAGE_SIZE = 50

function readPageToken(nextPageUrl: string | undefined): string | null {
  if (!nextPageUrl) return null
  return new URL(
    nextPageUrl,
    "https://conversations.twilio.com"
  ).searchParams.get("PageToken")
}

export async function fetchConversationsByParticipant(
  address: string,
  client: ReturnType<typeof getTwilioClient>,
  pageToken?: string
): Promise<ParticipantConversationPage> {
  const page = await client.conversations.v1.participantConversations.page({
    address,
    pageSize: PARTICIPANT_CONVERSATION_PAGE_SIZE,
    pageToken,
  })

  const conversations = page.instances.map((pc) => ({
    conversationSid: pc.conversationSid,
    conversationState: pc.conversationState as string,
    conversationDateCreated: pc.conversationDateCreated ?? null,
    conversationDateUpdated: pc.conversationDateUpdated ?? null,
    conversationFriendlyName: pc.conversationFriendlyName ?? null,
    participantSid: pc.participantSid,
    participantIdentity: pc.participantIdentity ?? null,
    participantMessagingBinding:
      (pc.participantMessagingBinding as Record<string, unknown> | null) ??
      null,
  }))

  return {
    conversations: sortParticipantConversations(conversations),
    nextPageToken: readPageToken(page.nextPageUrl),
  }
}
