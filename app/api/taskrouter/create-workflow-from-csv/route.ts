import { SSE_HEADERS } from "@/lib/sse-headers"
import { strings } from "@/lib/strings"
import { createWorkflow } from "@/features/taskrouter/lib/create-workflow"
import { sseEvent } from "@/features/conversations/lib/close"
import { AppError, fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import { isTwilioSid, parseTwilioCredentials, readJsonObject } from "@/lib/request-validation"

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
    return Response.json(
      { error: strings.common.validation.invalidCredentials },
      { status: 400 }
    )
  }

  if (!body.workspaceSid || typeof body.workspaceSid !== "string") {
    return Response.json(
      { error: strings.common.validation.workspaceRequired },
      { status: 400 }
    )
  }
  const workspaceSid = body.workspaceSid.trim()
  if (!isTwilioSid(workspaceSid, "WS")) {
    return Response.json({ error: strings.common.validation.invalidWorkspaceSid }, { status: 400 })
  }

  if (!body.workflowName || typeof body.workflowName !== "string" || !body.workflowName.trim()) {
    return Response.json(
      { error: strings.common.validation.workflowRequired },
      { status: 400 }
    )
  }
  const workflowNameInput = body.workflowName.trim()

  if (!body.csvContent || typeof body.csvContent !== "string" || !body.csvContent.trim()) {
    return Response.json(
      { error: strings.common.validation.csvRequired },
      { status: 400 }
    )
  }
  const csvContent = body.csvContent
  if (csvContent.length > 1_000_000) {
    return Response.json(
      { error: strings.common.validation.csvTooLarge },
      { status: 400 }
    )
  }

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
        const { workflowSid, workflowName, totalFilters } =
          await createWorkflow(
            {
              workspaceSid,
              workflowName: workflowNameInput,
              csvContent,
            },
            client,
            emit
          )

        emit(
          sseEvent(
            "success",
            strings.taskrouter.createWorkflow.log.done(
              workflowName,
              totalFilters
            ),
            { done: true, workflowSid, workflowName, totalFilters }
          )
        )
      } catch (err) {
        // Twilio API errors have a numeric .status; CSV/logic errors do not.
        const isTwilioError =
          typeof err === "object" &&
          err !== null &&
          "status" in err &&
          typeof err.status === "number"
        if (isTwilioError) {
          const appErr = fromTwilioError(
            err,
            "taskrouter/create-workflow-from-csv"
          )
          emit(sseEvent("error", appErr.safeMessage, { done: true }))
        } else {
          const message =
            err instanceof AppError
              ? err.safeMessage
              : strings.taskrouter.createWorkflow.log.unexpectedError
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
