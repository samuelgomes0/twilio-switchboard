import { fetchConversation } from "@/features/conversations/lib/fetch"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: { sid?: unknown; accountSid?: string; authToken?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })
  }

  const sid = typeof body.sid === "string" ? body.sid.trim() : ""

  if (!sid) {
    return Response.json({ error: "O campo 'sid' é obrigatório" }, { status: 400 })
  }

  if (!/^CH[a-f0-9]{32}$/i.test(sid)) {
    return Response.json(
      { error: "SID de conversa inválido. Formato esperado: CH + 32 caracteres hex" },
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
    const data = await fetchConversation(sid, client)
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "conversations/fetch")
    if (appErr.kind === "not_found") {
      return Response.json({ error: `Conversa não encontrada: ${sid}` }, { status: 404 })
    }
    return toApiResponse(appErr)
  }
}
