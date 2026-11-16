import { getTwilioClient } from "@/lib/twilio-client"
import type { NumberListResult, NumberRecord } from "@/features/numbers/types"

const SOURCE_LIMIT = 1000

// Strips the "whatsapp:" prefix and collapses whitespace so phone numbers
// from different API sources can be compared reliably.
function normalizePhone(raw: string): string {
  return raw
    .replace(/^whatsapp:/i, "")
    .replace(/\s+/g, "")
    .trim()
}

export async function listNumbers(
  client: ReturnType<typeof getTwilioClient>
): Promise<NumberListResult> {
  // Fetch both sources in parallel; partial failures are tolerated via allSettled.
  const [addressConfigsResult, whatsappSendersResult] =
    await Promise.allSettled([
      client.conversations.v1.addressConfigurations.list({ limit: SOURCE_LIMIT + 1 }),
      client.messaging.v2.channelsSenders.list({ channel: "whatsapp", limit: SOURCE_LIMIT + 1 }),
    ])

  const records: NumberRecord[] = []
  if (
    addressConfigsResult.status === "rejected" &&
    whatsappSendersResult.status === "rejected"
  ) {
    throw new Error("Number sources unavailable")
  }
  const partial =
    addressConfigsResult.status === "rejected" ||
    whatsappSendersResult.status === "rejected"
  const hasMore =
    (addressConfigsResult.status === "fulfilled" &&
      addressConfigsResult.value.length > SOURCE_LIMIT) ||
    (whatsappSendersResult.status === "fulfilled" &&
      whatsappSendersResult.value.length > SOURCE_LIMIT)
  // Tracks normalised phone strings to prevent duplicates across both APIs.
  const seenPhones = new Set<string>()

  // Conversations numbers take priority, so their phones are registered first.
  if (addressConfigsResult.status === "fulfilled") {
    for (const config of addressConfigsResult.value.slice(0, SOURCE_LIMIT)) {
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

  // Only Programmable Chat senders not already present as Conversations are added.
  if (whatsappSendersResult.status === "fulfilled") {
    for (const sender of whatsappSendersResult.value.slice(0, SOURCE_LIMIT)) {
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

  return { numbers: records, partial, hasMore }
}
