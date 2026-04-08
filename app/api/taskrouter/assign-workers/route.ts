import { assignWorkersToQueue } from "@/features/taskrouter/lib/assign-workers"
import { sseEvent } from "@/features/conversations/lib/close"
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
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!body.workspaceSid || typeof body.workspaceSid !== "string") {
    return new Response(
      JSON.stringify({
        error: "workspaceSid is required and must be a string",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!body.skill || typeof body.skill !== "string") {
    return new Response(
      JSON.stringify({ error: "skill is required and must be a string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!Array.isArray(body.emails) || body.emails.length === 0) {
    return new Response(
      JSON.stringify({ error: "emails must be a non-empty array of strings" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const emails = (body.emails as unknown[])
    .map((e) => String(e).trim())
    .filter(Boolean)

  if (emails.length === 0) {
    return new Response(JSON.stringify({ error: "No valid emails provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const level =
    body.level !== undefined && body.level !== null ? Number(body.level) : null

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
