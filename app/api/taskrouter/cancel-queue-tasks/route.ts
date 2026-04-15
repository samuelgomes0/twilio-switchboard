import { sseEvent } from "@/features/conversations/lib/close"
import { cancelQueueTasks } from "@/features/taskrouter/lib/cancel-queue-tasks"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    workspaceSid?: unknown
    taskQueueName?: unknown
    closeMessage?: unknown
    accountSid?: string
    authToken?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!body.workspaceSid || typeof body.workspaceSid !== "string") {
    return new Response(
      JSON.stringify({ error: "workspaceSid is required and must be a string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!body.taskQueueName || typeof body.taskQueueName !== "string") {
    return new Response(
      JSON.stringify({ error: "taskQueueName is required and must be a string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const closeMessage =
    typeof body.closeMessage === "string" && body.closeMessage.trim()
      ? body.closeMessage.trim()
      : undefined

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function emit(chunk: string) {
        controller.enqueue(encoder.encode(chunk))
      }

      const { totalSuccess, totalSkipped, totalErrors } = await cancelQueueTasks(
        {
          workspaceSid: body.workspaceSid as string,
          taskQueueName: body.taskQueueName as string,
          closeMessage,
        },
        client,
        emit
      )

      emit(
        sseEvent(
          "info",
          `Concluído. ${totalSuccess} cancelada(s), ${totalSkipped} ignorada(s), ${totalErrors} erro(s).`,
          {
            done: true,
            totalSuccess,
            totalSkipped,
            totalErrors,
          }
        )
      )

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
