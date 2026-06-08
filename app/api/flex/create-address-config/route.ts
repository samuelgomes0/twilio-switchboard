import { createAddressConfig } from "@/features/flex/lib/create-address-config"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })
  }

  const address = typeof body.address === "string" ? body.address.trim() : ""
  const type = typeof body.type === "string" ? body.type.trim() : ""

  if (!address) {
    return Response.json({ error: "O campo 'address' é obrigatório" }, { status: 400 })
  }
  if (!type) {
    return Response.json({ error: "O campo 'type' é obrigatório" }, { status: 400 })
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
    const data = await createAddressConfig(
      body as unknown as Parameters<typeof createAddressConfig>[0],
      client
    )
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (message.includes("409") || message.toLowerCase().includes("already exists")) {
      return Response.json(
        { error: `Endereço já configurado: ${address}` },
        { status: 409 }
      )
    }
    if (message.includes("400") || message.toLowerCase().includes("invalid")) {
      return Response.json({ error: message }, { status: 400 })
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
