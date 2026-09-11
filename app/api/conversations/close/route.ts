import { strings } from "@/lib/strings"
import {
  closeConversations,
  sseEvent,
} from "@/features/conversations/lib/close"
import { toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: { participants?: unknown; accountSid?: string; authToken?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }

  const raw = body.participants
  if (!Array.isArray(raw) || raw.length === 0) {
    return Response.json(
      { error: strings.common.validation.participantsRequired },
      { status: 400 }
    )
  }

  const participants = (raw as unknown[])
    .map((p) => String(p).trim())
    .filter(Boolean)

  if (participants.length === 0) {
    return Response.json(
      { error: strings.common.validation.noValidParticipants },
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

      emit(
        sseEvent(
          "info",
          strings.conversations.close.log.start(participants.length)
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
          strings.conversations.close.log.done(totalClosed, totalErrors),
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
