import {
  closeConversations,
  sseEvent,
} from "@/features/conversations/lib/close"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: { participants?: unknown; accountSid?: string; authToken?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const raw = body.participants
  if (!Array.isArray(raw) || raw.length === 0) {
    return new Response(
      JSON.stringify({
        error: "participants must be a non-empty array of strings",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const participants = (raw as unknown[])
    .map((p) => String(p).trim())
    .filter(Boolean)

  if (participants.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid participants provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

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
          `Iniciando processamento de ${participants.length} número(s)...`
        )
      )

      const { totalClosed, totalErrors } = await closeConversations(
        participants,
        client,
        emit
      )

      emit(
        sseEvent(
          "info",
          `Concluído. ${totalClosed} conversa(s) fechada(s), ${totalErrors} erro(s).`,
          {
            done: true,
            totalClosed,
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
