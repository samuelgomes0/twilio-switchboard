import { closeConversation } from "@/features/conversations/lib/close-conversation"
import { validateConsultInput } from "@/features/conversations/lib/validate-consult-input"
import { getTwilioClient } from "@/lib/twilio-client"
import { strings } from "@/lib/strings"

export async function POST(req: Request) {
  const input = validateConsultInput(await req.json().catch(() => null))
  if (!input)
    return Response.json(
      { error: strings.conversations.consult.invalidInput },
      { status: 400 }
    )
  try {
    const client = getTwilioClient(input.accountSid, input.authToken)
    const result = await closeConversation(input.sid, client, req.signal)
    return Response.json(result, { status: "error" in result ? 500 : 200 })
  } catch {
    return Response.json(
      { error: strings.conversations.closeSingle.error },
      { status: 500 }
    )
  }
}
