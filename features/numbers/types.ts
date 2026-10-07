export type PhoneNumberService = "Conversations" | "Programmable Chat"

export interface NumberRecord {
  id: string
  phoneNumber: string
  friendlyName: string
  service: PhoneNumberService
}

export interface NumberListResult {
  numbers: NumberRecord[]
  partial: boolean
  hasMore: boolean
}
