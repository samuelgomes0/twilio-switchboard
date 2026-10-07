import type { ConversationConsultInput } from "@/features/conversations/types"
import {
  isRecord,
  parseTwilioCredentials,
} from "@/lib/request-validation"

export function validateConsultInput(
  value: unknown
): ConversationConsultInput | null {
  if (!isRecord(value)) return null
  const { sid } = value
  if (typeof sid !== "string" || !/^CH[a-f0-9]{32}$/i.test(sid.trim()))
    return null
  const credentials = parseTwilioCredentials(value)
  return credentials ? { sid: sid.trim(), ...credentials } : null
}
