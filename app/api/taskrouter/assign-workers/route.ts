import { assignWorkersToQueue } from "@/features/taskrouter/lib/assign-workers"
import { sseEvent } from "@/features/conversations/lib/close"
import { MAX_ITEMS } from "@/lib/constants"
import { toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    workspaceSid?: unknown
    skill?: unknown
    level?: unknown
    emails?: unknown
    accountSid?: string
    authToken?: string
  }

  try {
    body = await req.json()
  } catch {
    return Response.json(
      { error: "Corpo da requisição inválido" },
      { status: 400 }
    )
  }

  if (!body.workspaceSid || typeof body.workspaceSid !== "string") {
    return Response.json(
      { error: "O campo 'workspaceSid' é obrigatório" },
      { status: 400 }
    )
  }

  if (!body.skill || typeof body.skill !== "string") {
    return Response.json(
      { error: "O campo 'skill' é obrigatório" },
      { status: 400 }
    )
  }

  if (
    !Array.isArray(body.emails) ||
    body.emails.length === 0 ||
    body.emails.length > MAX_ITEMS ||
    !body.emails.every(
      (identifier) =>
        typeof identifier === "string" && identifier.trim().length > 0
    )
  ) {
    return Response.json(
      { error: `Informe entre 1 e ${MAX_ITEMS} Workers válidos` },
      { status: 400 }
    )
  }

  const emails = [
    ...new Set((body.emails as string[]).map((email) => email.trim())),
  ]

  const level =
    body.level !== undefined && body.level !== null ? Number(body.level) : null

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

      emit(
        sseEvent(
          "info",
          `Iniciando processamento de ${emails.length} worker(s)...`
        )
      )

      const { totalUpdated, totalSkipped, totalErrors } =
        await assignWorkersToQueue(
          {
            workspaceSid: body.workspaceSid as string,
            skill: body.skill as string,
            level,
            emails,
            accountSid: body.accountSid,
            authToken: body.authToken,
          },
          client,
          emit
        )

      emit(
        sseEvent(
          "info",
          `Concluído. ${totalUpdated} worker(s) atualizado(s), ${totalSkipped} ignorado(s), ${totalErrors} erro(s).`,
          {
            done: true,
            totalUpdated,
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
