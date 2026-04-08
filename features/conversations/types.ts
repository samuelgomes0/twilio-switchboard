export interface MessagingBinding {
  type?: string
  address?: string
  proxy_address?: string
  [key: string]: unknown
}

export interface Participant {
  sid: string
  identity: string | null
  messagingBinding: MessagingBinding | null
  dateCreated: Date | null
  dateUpdated: Date | null
  attributes: string
  roleSid: string | null
}

export interface ConversationData {
  sid: string
  friendlyName: string | null
  state: string
  dateCreated: Date | null
  dateUpdated: Date | null
  attributes: string
  messagingServiceSid: string | null
  url: string
  timers: Record<string, unknown>
}

export interface FetchResponse {
  conversation: ConversationData
  participants: Participant[]
}
