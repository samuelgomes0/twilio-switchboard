import { fetchWorker } from "@/features/taskrouter/lib/fetch-worker"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const workspaceSid = req.nextUrl.searchParams.get("workspaceSid")?.trim()
  const identifier = req.nextUrl.searchParams.get("identifier")?.trim()

  if (!workspaceSid) {
    return Response.json(
      { error: "Query param 'workspaceSid' é obrigatório" },
      { status: 400 }
    )
  }

  if (!identifier) {
    return Response.json(
      { error: "Query param 'identifier' é obrigatório" },
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
    const data = await fetchWorker(workspaceSid, identifier, client)
    if (!data) {
      return Response.json(
        { error: `Worker não encontrado: ${identifier}` },
        { status: 404 }
      )
    }
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.includes("404") ||
      message.toLowerCase().includes("not found")
    ) {
      return Response.json(
        { error: `Worker não encontrado: ${identifier}` },
        { status: 404 }
      )
    }
    return Response.json({ error: message }, { status: 500 })
  }
}
