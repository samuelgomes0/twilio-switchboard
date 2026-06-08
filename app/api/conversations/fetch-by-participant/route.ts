import { fetchConversationsByParticipant } from "@/features/conversations/lib/fetch-by-participant"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: { address?: unknown; accountSid?: string; authToken?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })
  }

  const address = typeof body.address === "string" ? body.address.trim() : ""

  if (!address) {
    return Response.json({ error: "O campo 'address' é obrigatório" }, { status: 400 })
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    const conversations = await fetchConversationsByParticipant(address, client)
    return Response.json({ conversations })
  } catch (err) {
    return toApiResponse(fromTwilioError(err, "conversations/fetch-by-participant"))
  }
}
