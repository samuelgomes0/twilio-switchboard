import { SSE_HEADERS } from "@/lib/sse-headers"
import { strings } from "@/lib/strings"
import {
  closeConversations,
  sseEvent,
} from "@/features/conversations/lib/close"
import { toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import { MAX_ITEMS } from "@/lib/constants"
import { normalizeClosePhone } from "@/features/conversations/lib/normalize-close-phone"

export async function POST(req: NextRequest) {
  let value: unknown
  try {
    value = await req.json()
  } catch {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }
  const body = value as Record<string, unknown>
  const raw = body.participants
  if (!Array.isArray(raw) || raw.length === 0) {
    return Response.json(
      { error: strings.common.validation.participantsRequired },
      { status: 400 }
    )
  }

  if (raw.length > MAX_ITEMS) {
    return Response.json(
      { error: strings.conversations.close.maxExceeded(MAX_ITEMS) },
      { status: 400 }
    )
  }
  const participants: string[] = []
  for (const phone of raw) {
    if (typeof phone !== "string" || normalizeClosePhone(phone) === null) {
      return Response.json(
        { error: strings.conversations.close.invalidPhone },
        { status: 400 }
      )
    }
    participants.push(phone.trim())
  }
  const { accountSid, authToken } = body
  if (
    (accountSid !== undefined &&
      (typeof accountSid !== "string" || !/^AC[a-f0-9]{32}$/i.test(accountSid))) ||
    (authToken !== undefined &&
      (typeof authToken !== "string" || !/^[a-f0-9]{32}$/i.test(authToken))) ||
    (accountSid === undefined) !== (authToken === undefined)
  ) {
    return Response.json(
      { error: strings.common.validation.invalidCredentials },
      { status: 400 }
    )
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(accountSid, authToken)
  } catch (err) {
    const response = toApiResponse(err)
    return new Response(response.body, { status: 500, headers: response.headers })
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
    headers: SSE_HEADERS,
  })
}
