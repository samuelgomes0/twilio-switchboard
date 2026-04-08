import { fetchTask } from "@/features/taskrouter/lib/fetch-task"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const workspaceSid = req.nextUrl.searchParams.get("workspaceSid")?.trim()
  const taskSid = req.nextUrl.searchParams.get("taskSid")?.trim()

  if (!workspaceSid) {
    return Response.json(
      { error: "Query param 'workspaceSid' é obrigatório" },
      { status: 400 }
    )
  }

  if (!taskSid) {
    return Response.json(
      { error: "Query param 'taskSid' é obrigatório" },
      { status: 400 }
    )
  }

  if (!/^WT[a-f0-9]{32}$/i.test(taskSid)) {
    return Response.json(
      { error: "Task SID inválido. Formato esperado: WT + 32 caracteres hex" },
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
    const data = await fetchTask(workspaceSid, taskSid, client)
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.includes("404") ||
      message.toLowerCase().includes("not found")
    ) {
      return Response.json(
        { error: `Task não encontrada: ${taskSid}` },
        { status: 404 }
      )
    }
    return Response.json({ error: message }, { status: 500 })
  }
}
