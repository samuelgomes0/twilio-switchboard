import { searchTasks } from "@/features/taskrouter/lib/search-tasks"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const workspaceSid = req.nextUrl.searchParams.get("workspaceSid")?.trim()
  const phoneNumber = req.nextUrl.searchParams.get("phoneNumber")?.trim()

  if (!workspaceSid) {
    return Response.json(
      { error: "Query param 'workspaceSid' é obrigatório" },
      { status: 400 }
    )
  }

  if (!phoneNumber) {
    return Response.json(
      { error: "Query param 'phoneNumber' é obrigatório" },
      { status: 400 }
    )
  }

  if (!/^WS[a-f0-9]{32}$/i.test(workspaceSid)) {
    return Response.json(
      {
        error:
          "Workspace SID inválido. Formato esperado: WS + 32 caracteres hex",
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
    const data = await searchTasks(workspaceSid, phoneNumber, client)
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.includes("404") ||
      message.toLowerCase().includes("not found")
    ) {
      return Response.json(
        { error: `Workspace não encontrado: ${workspaceSid}` },
        { status: 404 }
      )
    }
    if (
      message.includes("20003") ||
      message.toLowerCase().includes("authenticate")
    ) {
      return Response.json(
        { error: "Credenciais inválidas ou sem permissão" },
        { status: 401 }
      )
    }
    return Response.json({ error: message }, { status: 500 })
  }
}
