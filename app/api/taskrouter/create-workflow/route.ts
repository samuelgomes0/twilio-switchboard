import { createWorkflow } from "@/features/taskrouter/lib/create-workflow"
import { sseEvent } from "@/features/conversations/lib/close"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    workspaceSid?: unknown
    workflowName?: unknown
    csvContent?: unknown
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

  if (!body.workflowName || typeof body.workflowName !== "string") {
    return Response.json(
      { error: "O campo 'workflowName' é obrigatório" },
      { status: 400 }
    )
  }

  if (!body.csvContent || typeof body.csvContent !== "string") {
    return Response.json(
      { error: "O campo 'csvContent' é obrigatório" },
      { status: 400 }
    )
  }

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

      try {
        const { workflowSid, workflowName, totalFilters } =
          await createWorkflow(
            {
              workspaceSid: body.workspaceSid as string,
              workflowName: body.workflowName as string,
              csvContent: body.csvContent as string,
              accountSid: body.accountSid,
              authToken: body.authToken,
            },
            client,
            emit
          )

        emit(
          sseEvent(
            "success",
            `Concluído. Workflow "${workflowName}" criado com ${totalFilters} filtro(s).`,
            { done: true, workflowSid, workflowName, totalFilters }
          )
        )
      } catch (err) {
        // Twilio API errors have a numeric .status; CSV/logic errors do not.
        const isTwilioError =
          typeof (err as Record<string, unknown>).status === "number"
        if (isTwilioError) {
          const appErr = fromTwilioError(err, "taskrouter/create-workflow")
          emit(sseEvent("error", appErr.safeMessage, { done: true }))
        } else {
          const message =
            err instanceof Error
              ? err.message
              : "Erro inesperado ao criar workflow."
          emit(sseEvent("error", message, { done: true }))
        }
      }

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
