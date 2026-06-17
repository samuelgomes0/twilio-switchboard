import { sseEvent } from "@/features/conversations/lib/close"
import { addParticularFilter } from "@/features/taskrouter/lib/add-particular-filter"
import type { AddParticularFilterEntry } from "@/features/taskrouter/types"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    workspaceSid?: unknown
    filterName?: unknown
    entries?: unknown
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

  if (!body.filterName || typeof body.filterName !== "string") {
    return Response.json(
      { error: "O campo 'filterName' é obrigatório" },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return Response.json(
      { error: "O campo 'entries' deve ser um array não-vazio" },
      { status: 400 }
    )
  }

  for (const entry of body.entries as unknown[]) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as Record<string, unknown>).workflowSid !== "string" ||
      typeof (entry as Record<string, unknown>).taskQueueSid !== "string"
    ) {
      return Response.json(
        {
          error:
            "Cada entrada deve conter 'workflowSid' e 'taskQueueSid' como strings",
        },
        { status: 400 }
      )
    }
  }

  const entries = body.entries as AddParticularFilterEntry[]

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
        const { totalAdded, totalSkipped, totalErrors } =
          await addParticularFilter(
            {
              workspaceSid: body.workspaceSid as string,
              filterName: body.filterName as string,
              entries,
              accountSid: body.accountSid,
              authToken: body.authToken,
            },
            client,
            emit
          )

        const level =
          totalAdded > 0 || totalSkipped > 0 ? "success" : "error"
        emit(
          sseEvent(
            level,
            `Concluído. ${totalAdded} adicionado(s), ${totalSkipped} ignorado(s), ${totalErrors} erro(s).`,
            { done: true, totalAdded, totalSkipped, totalErrors }
          )
        )
      } catch (err) {
        const isTwilioError =
          typeof (err as Record<string, unknown>).status === "number"
        if (isTwilioError) {
          const appErr = fromTwilioError(
            err,
            "taskrouter/add-particular-filter"
          )
          emit(sseEvent("error", appErr.safeMessage, { done: true }))
        } else {
          const message =
            err instanceof Error
              ? err.message
              : "Erro inesperado ao processar filtros."
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
