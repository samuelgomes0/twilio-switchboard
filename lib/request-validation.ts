export interface TwilioCredentials {
  accountSid: string
  authToken: string
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function readJsonObject(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json()
    return isRecord(value) ? value : null
  } catch {
    return null
  }
}

export function parseTwilioCredentials(
  value: Record<string, unknown>
): TwilioCredentials | null {
  const { accountSid, authToken } = value
  if (
    typeof accountSid !== "string" ||
    !/^AC[0-9a-f]{32}$/i.test(accountSid) ||
    typeof authToken !== "string" ||
    !/^[0-9a-f]{32}$/i.test(authToken)
  ) {
    return null
  }
  return { accountSid, authToken }
}

export function isTwilioSid(value: string, prefix: string): boolean {
  return new RegExp(`^${prefix}[0-9a-f]{32}$`, "i").test(value)
}
