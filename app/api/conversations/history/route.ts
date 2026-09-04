import { fetchConversationHistory } from "@/features/conversations/lib/history"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

const CONVERSATION_SID_PATTERN = /^CH[a-f0-9]{32}$/i

export async function POST(req: NextRequest) {
  let body: {
    sid?: unknown
    accountSid?: unknown
    authToken?: unknown
  }

  try {
    body = await req.json()
  } catch {
    return Response.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    )
  }

  const sid = typeof body.sid === "string" ? body.sid.trim() : ""
  if (!CONVERSATION_SID_PATTERN.test(sid)) {
    return Response.json(
      { error: "Conversation SID inválido." },
      { status: 400 }
    )
  }

  if (
    (body.accountSid !== undefined && typeof body.accountSid !== "string") ||
    (body.authToken !== undefined && typeof body.authToken !== "string")
  ) {
    return Response.json(
      { error: "Credenciais em formato inválido." },
      { status: 400 }
    )
  }

  const accountSid =
    typeof body.accountSid === "string" ? body.accountSid : undefined
  const authToken =
    typeof body.authToken === "string" ? body.authToken : undefined

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(accountSid, authToken)
  } catch (error) {
    return toApiResponse(error)
  }

  try {
    return Response.json(await fetchConversationHistory(sid, client))
  } catch (error) {
    return toApiResponse(fromTwilioError(error, "conversations/history"))
  }
}
