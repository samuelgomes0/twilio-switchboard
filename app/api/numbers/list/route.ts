import { strings } from "@/lib/strings"
import { listNumbers } from "@/features/numbers/lib/list-numbers"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: { accountSid?: string; authToken?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    const numbers = await listNumbers(client)
    return Response.json({ numbers })
  } catch (err) {
    return toApiResponse(fromTwilioError(err, "numbers/list"))
  }
}
