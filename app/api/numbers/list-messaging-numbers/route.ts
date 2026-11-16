import { strings } from "@/lib/strings"
import { listNumbers } from "@/features/numbers/lib/list-numbers"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import {
  parseTwilioCredentials,
  readJsonObject,
} from "@/lib/request-validation"

export async function POST(req: NextRequest) {
  const body = await readJsonObject(req)
  if (!body) {
    return Response.json(
      { error: strings.common.validation.invalidBody },
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

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    return Response.json(await listNumbers(client))
  } catch (err) {
    return toApiResponse(fromTwilioError(err, "numbers/list-messaging-numbers"))
  }
}
