import { getTwilioClient } from "@/lib/twilio-client"
import type { NumberRecord } from "@/features/numbers/types"

// Strips the "whatsapp:" prefix and collapses whitespace so phone numbers
// from different API sources can be compared reliably.
export function normalizePhone(raw: string): string {
  return raw
    .replace(/^whatsapp:/i, "")
    .replace(/\s+/g, "")
    .trim()
}

export async function listNumbers(
  client: ReturnType<typeof getTwilioClient>
): Promise<NumberRecord[]> {
  // Fetch both sources in parallel; partial failures are tolerated via allSettled.
  const [addressConfigsResult, whatsappSendersResult] =
    await Promise.allSettled([
      client.conversations.v1.addressConfigurations.list({ limit: 1000 }),
      client.messaging.v2.channelsSenders.list({ channel: "whatsapp" }),
    ])

  const records: NumberRecord[] = []
  // Tracks normalised phone strings to prevent duplicates across both APIs.
  const seenPhones = new Set<string>()

  // Conversations numbers take priority — process and register their phones first.
  if (addressConfigsResult.status === "fulfilled") {
    for (const config of addressConfigsResult.value) {
      const phone = normalizePhone(config.address)
      if (!phone || seenPhones.has(phone)) continue
      seenPhones.add(phone)
      records.push({
        id: config.sid,
        phoneNumber: phone,
        friendlyName: config.friendlyName || phone,
        service: "Conversations",
      })
    }
  }

  // Programmable Chat — only senders not already present as Conversations.
  if (whatsappSendersResult.status === "fulfilled") {
    for (const sender of whatsappSendersResult.value) {
      const phone = normalizePhone(sender.senderId)
      if (!phone || seenPhones.has(phone)) continue
      seenPhones.add(phone)
      records.push({
        id: sender.sid,
        phoneNumber: phone,
        friendlyName: phone,
        service: "Programmable Chat",
      })
    }
  }

  return records
}
