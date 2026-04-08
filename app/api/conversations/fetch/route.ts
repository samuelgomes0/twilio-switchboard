import { fetchConversation } from "@/features/conversations/lib/fetch"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid")?.trim()

  if (!sid) {
    return Response.json(
      { error: "Query param 'sid' is required" },
      { status: 400 }
    )
  }

  if (!/^CH[a-f0-9]{32}$/i.test(sid)) {
    return Response.json(
      {
        error:
          "Invalid Conversation SID format. Expected: CH followed by 32 hex characters",
      },
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
    const data = await fetchConversation(sid, client)
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Twilio 404 — conversation not found
    if (
      message.includes("404") ||
      message.toLowerCase().includes("not found")
    ) {
      return Response.json(
        { error: `Conversa não encontrada: ${sid}` },
        { status: 404 }
      )
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
