import { listNumbers } from "@/features/numbers/lib/list-numbers"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const accountSid = req.headers.get("x-twilio-account-sid") ?? undefined
  const authToken = req.headers.get("x-twilio-auth-token") ?? undefined

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(accountSid, authToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }

  try {
    const numbers = await listNumbers(client)
    return Response.json({ numbers })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
