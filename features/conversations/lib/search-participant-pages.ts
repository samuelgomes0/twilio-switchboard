import type {
  ParticipantConversation,
  ParticipantConversationPage,
} from "./fetch-by-participant"

export function sortParticipantConversations(
  conversations: ParticipantConversation[]
): ParticipantConversation[] {
  return [...conversations].sort((a, b) => {
    const priority =
      Number(b.conversationState === "active") -
      Number(a.conversationState === "active")
    if (priority) return priority
    return (
      new Date(b.conversationDateUpdated ?? 0).getTime() -
      new Date(a.conversationDateUpdated ?? 0).getTime()
    )
  })
}

export async function searchParticipantPages(
  fetchPage: (pageToken?: string) => Promise<ParticipantConversationPage>,
  signal: AbortSignal,
  onPage: (conversations: ParticipantConversation[], pages: number) => void
): Promise<ParticipantConversation[]> {
  const conversations = new Map<string, ParticipantConversation>()
  const seenTokens = new Set<string>()
  let pageToken: string | undefined
  let pages = 0
  do {
    signal.throwIfAborted()
    const page = await fetchPage(pageToken)
    signal.throwIfAborted()
    for (const conversation of page.conversations)
      conversations.set(conversation.conversationSid, conversation)
    onPage(sortParticipantConversations([...conversations.values()]), ++pages)
    pageToken = page.nextPageToken ?? undefined
    if (pageToken && seenTokens.has(pageToken))
      throw new Error("Repeated pagination token")
    if (pageToken) seenTokens.add(pageToken)
  } while (pageToken)
  return sortParticipantConversations([...conversations.values()])
}
