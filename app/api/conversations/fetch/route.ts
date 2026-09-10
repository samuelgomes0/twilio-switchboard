import { fetchConversation } from "@/features/conversations/lib/fetch"
import { validateConsultInput } from "@/features/conversations/lib/validate-consult-input"
import { strings } from "@/lib/strings"
import { getTwilioClient } from "@/lib/twilio-client"

export async function POST(req: Request) {
  const input = validateConsultInput(await req.json().catch(() => null))
  if (!input)
    return Response.json(
      { error: strings.conversations.consult.invalidInput },
      { status: 400 }
    )
  try {
    const client = getTwilioClient(input.accountSid, input.authToken)
    return Response.json(await fetchConversation(input.sid, client))
  } catch {
    return Response.json(
      { error: strings.conversations.consult.apiError },
      { status: 500 }
    )
  }
}
