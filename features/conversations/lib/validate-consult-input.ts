import type { ConversationConsultInput } from "@/features/conversations/types"

export function validateConsultInput(
  value: unknown
): ConversationConsultInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null
  const { sid, accountSid, authToken } = value as Record<string, unknown>
  if (typeof sid !== "string" || !/^CH[a-f0-9]{32}$/i.test(sid.trim()))
    return null
  if (
    accountSid !== undefined &&
    (typeof accountSid !== "string" || !/^AC[a-f0-9]{32}$/i.test(accountSid))
  )
    return null
  if (
    authToken !== undefined &&
    (typeof authToken !== "string" || !/^[a-f0-9]{32}$/i.test(authToken))
  )
    return null
  if ((accountSid === undefined) !== (authToken === undefined)) return null
  return { sid: sid.trim(), accountSid, authToken }
}
