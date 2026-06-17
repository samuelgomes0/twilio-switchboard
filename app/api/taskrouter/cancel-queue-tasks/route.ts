import { sseEvent } from "@/features/conversations/lib/close"
import { cancelQueueTasks } from "@/features/taskrouter/lib/cancel-queue-tasks"
import { toApiResponse } from "@/lib/errors"
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
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 })
  }

  if (!body.workspaceSid || typeof body.workspaceSid !== "string") {
    return Response.json(
      { error: "O campo 'workspaceSid' é obrigatório" },
      { status: 400 }
    )
  }

  if (!body.taskQueueName || typeof body.taskQueueName !== "string") {
    return Response.json(
      { error: "O campo 'taskQueueName' é obrigatório" },
      { status: 400 }
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
    return toApiResponse(err)
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function emit(chunk: string) {
        controller.enqueue(encoder.encode(chunk))
      }

      const { totalSuccess, totalSkipped, totalErrors } =
        await cancelQueueTasks(
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
