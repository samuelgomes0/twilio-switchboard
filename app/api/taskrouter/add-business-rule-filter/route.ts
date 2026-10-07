import { SSE_HEADERS } from "@/lib/sse-headers"
import { strings } from "@/lib/strings"
import { sseEvent } from "@/features/conversations/lib/close"
import { addParticularFilter } from "@/features/taskrouter/lib/add-particular-filter"
import type { AddParticularFilterEntry } from "@/features/taskrouter/types"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import { isTwilioSid, parseTwilioCredentials, readJsonObject } from "@/lib/request-validation"
import { isSafeTaskRouterLiteral } from "@/features/taskrouter/lib/taskrouter-expression"
import { MAX_ITEMS } from "@/lib/constants"

export async function POST(req: NextRequest) {
  const body = await readJsonObject(req)
  if (!body) {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }
  const credentials = parseTwilioCredentials(body)
  if (!credentials) {
    return Response.json({ error: strings.common.validation.invalidCredentials }, { status: 400 })
  }

  if (!body.workspaceSid || typeof body.workspaceSid !== "string") {
    return Response.json(
      { error: strings.common.validation.workspaceRequired },
      { status: 400 }
    )
  }
  if (!isTwilioSid(body.workspaceSid, "WS")) {
    return Response.json({ error: strings.common.validation.invalidWorkspaceSid }, { status: 400 })
  }

  if (!body.filterName || typeof body.filterName !== "string") {
    return Response.json(
      { error: strings.common.validation.filterRequired },
      { status: 400 }
    )
  }
  const filterName = body.filterName.trim()
  if (!isSafeTaskRouterLiteral(filterName)) {
    return Response.json({ error: strings.common.validation.invalidFilterName }, { status: 400 })
  }

  if (
    !Array.isArray(body.entries) ||
    body.entries.length === 0 ||
    body.entries.length > MAX_ITEMS
  ) {
    return Response.json(
      { error: strings.common.validation.entriesRequired },
      { status: 400 }
    )
  }

  for (const entry of body.entries as unknown[]) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as Record<string, unknown>).workflowSid !== "string" ||
      typeof (entry as Record<string, unknown>).taskQueueSid !== "string" ||
      !isTwilioSid((entry as Record<string, unknown>).workflowSid as string, "WW") ||
      !isTwilioSid((entry as Record<string, unknown>).taskQueueSid as string, "WQ")
    ) {
      return Response.json(
        {
          error: strings.common.validation.invalidEntries,
        },
        { status: 400 }
      )
    }
  }

  const entries = body.entries as AddParticularFilterEntry[]

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
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
              filterName,
              entries,
            },
            client,
            emit
          )

        const level = totalAdded > 0 || totalSkipped > 0 ? "success" : "error"
        emit(
          sseEvent(
            level,
            strings.taskrouter.addParticularFilter.log.done(
              totalAdded,
              totalSkipped,
              totalErrors
            ),
            { done: true, totalAdded, totalSkipped, totalErrors }
          )
        )
      } catch (err) {
        const isTwilioError =
          typeof err === "object" &&
          err !== null &&
          "status" in err &&
          typeof err.status === "number"
        if (isTwilioError) {
          const appErr = fromTwilioError(
            err,
            "taskrouter/add-business-rule-filter"
          )
          emit(sseEvent("error", appErr.safeMessage, { done: true }))
        } else {
          const message =
            strings.taskrouter.addParticularFilter.log.unexpectedError
          emit(sseEvent("error", message, { done: true }))
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: SSE_HEADERS,
  })
}
