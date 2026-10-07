import { strings } from "@/lib/strings"
import { fetchConversationsByParticipant } from "@/features/conversations/lib/fetch-by-participant"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import { parseTwilioCredentials } from "@/lib/request-validation"

export async function POST(req: NextRequest) {
  let value: unknown
  try {
    value = await req.json()
  } catch {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }
  const body = value as Record<string, unknown>
  const address = typeof body.address === "string" ? body.address.trim() : ""

  if (!/^whatsapp:\+55\d{10,11}$/.test(address)) {
    return Response.json(
      { error: strings.common.validation.addressRequired },
      { status: 400 }
    )
  }

  if (
    body.pageToken !== undefined &&
    (typeof body.pageToken !== "string" ||
      !body.pageToken ||
      body.pageToken.length > 2048)
  ) {
    return Response.json(
      { error: strings.common.validation.invalidPageToken },
      { status: 400 }
    )
  }

  const credentials = parseTwilioCredentials(body)
  if (!credentials) {
    return Response.json(
      { error: strings.common.validation.invalidCredentials },
      { status: 400 }
    )
  }

  const pageToken =
    typeof body.pageToken === "string" ? body.pageToken : undefined

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch (err) {
    const response = toApiResponse(err)
    return new Response(response.body, {
      status: 500,
      headers: response.headers,
    })
  }

  try {
    const page = await fetchConversationsByParticipant(
      address,
      client,
      pageToken
    )
    return Response.json(page)
  } catch (err) {
    const response = toApiResponse(
      fromTwilioError(err, "conversations/search-by-number")
    )
    return new Response(response.body, {
      status: 500,
      headers: response.headers,
    })
  }
}
