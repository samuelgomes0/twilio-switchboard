export type AddressConfigType =
  | "sms"
  | "whatsapp"
  | "messenger"
  | "gbm"
  | "email"
  | "rcs"
  | "apple"
  | "chat"

export type AutoCreationType = "webhook" | "studio" | "default"

export interface AutoCreationConfig {
  enabled: boolean
  type?: string
  conversationServiceSid?: string
  webhookUrl?: string
  webhookMethod?: string
  webhookFilters?: string[]
  studioFlowSid?: string
  studioRetryCount?: number
}

export interface AddressConfigData {
  sid: string
  accountSid: string
  address: string
  type: string
  friendlyName: string | null
  addressCountry: string | null
  autoCreation: AutoCreationConfig
  dateCreated: string | null
  dateUpdated: string | null
  url: string
}

export interface CreateAddressConfigRequest {
  address: string
  type: AddressConfigType
  friendlyName?: string
  autoCreationEnabled?: boolean
  autoCreationType?: AutoCreationType
  autoCreationConversationServiceSid?: string
  autoCreationWebhookUrl?: string
  autoCreationWebhookMethod?: "GET" | "POST"
  autoCreationWebhookFilters?: string[]
  autoCreationStudioFlowSid?: string
  autoCreationStudioRetryCount?: number
  addressCountry?: string
}
