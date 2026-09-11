import { strings } from "@/lib/strings"
import { fetchConversationsByParticipant } from "@/features/conversations/lib/fetch-by-participant"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    address?: unknown
    pageToken?: unknown
    accountSid?: unknown
    authToken?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }

  const address = typeof body.address === "string" ? body.address.trim() : ""

  if (!address) {
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

  if (
    (body.accountSid !== undefined && typeof body.accountSid !== "string") ||
    (body.authToken !== undefined && typeof body.authToken !== "string")
  ) {
    return Response.json(
      { error: strings.common.validation.invalidCredentials },
      { status: 400 }
    )
  }

  const pageToken =
    typeof body.pageToken === "string" ? body.pageToken : undefined

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    const page = await fetchConversationsByParticipant(
      address,
      client,
      pageToken
    )
    return Response.json(page)
  } catch (err) {
    return toApiResponse(
      fromTwilioError(err, "conversations/fetch-by-participant")
    )
  }
}
