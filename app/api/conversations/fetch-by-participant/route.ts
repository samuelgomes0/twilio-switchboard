import { fetchConversationsByParticipant } from "@/features/conversations/lib/fetch-by-participant"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim()

  if (!address) {
    return Response.json(
      { error: "Query param 'address' é obrigatório" },
      { status: 400 }
    )
  }

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
    const conversations = await fetchConversationsByParticipant(address, client)
    return Response.json({ conversations })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
