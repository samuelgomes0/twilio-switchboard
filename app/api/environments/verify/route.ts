import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: { accountSid?: string; authToken?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    )
  }

  try {
    await client.api.accounts(body.accountSid!).fetch()
    return Response.json({ ok: true })
  } catch (err: unknown) {
    const status = (err as { status?: number }).status
    const message = err instanceof Error ? err.message : String(err)
    if (status === 401 || status === 403 || status === 20003) {
      return Response.json(
        { error: "Credenciais inválidas ou sem permissão" },
        { status: 401 }
      )
    }
    return Response.json({ error: message }, { status: 500 })
  }
}
