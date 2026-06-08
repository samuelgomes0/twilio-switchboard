import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: { accountSid?: string; authToken?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    await client.api.accounts(body.accountSid!).fetch()
    return Response.json({ ok: true })
  } catch (err) {
    return toApiResponse(fromTwilioError(err, "environments/verify"))
  }
}
