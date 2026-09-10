import type {
  ConversationMessage,
  Participant,
} from "@/features/conversations/types"

function normalizeAddress(value: string): string {
  return value.trim().replace(/^whatsapp:/i, "")
}

export function isCustomerMessage(
  message: ConversationMessage,
  participants: Participant[]
): boolean {
  const participant = message.participantSid
    ? participants.find((candidate) => candidate.sid === message.participantSid)
    : undefined

  if (participant) return Boolean(participant.messagingBinding?.address)

  // REST-authored messages may lack a participant SID; compare only known customer addresses.
  const author = normalizeAddress(message.author)
  if (!author) return false
  return participants.some((candidate) => {
    const address = candidate.messagingBinding?.address
    return Boolean(address && normalizeAddress(address) === author)
  })
}
