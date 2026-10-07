import { strings } from "@/lib/strings"
import { sseEvent } from "@/lib/sse-event"
import { cancelQueueTasks } from "@/features/taskrouter/lib/cancel-queue-tasks"
import { toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import { isTwilioSid, parseTwilioCredentials, readJsonObject } from "@/lib/request-validation"
import { createSseResponse } from "@/lib/sse-response"

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

  if (!body.taskQueueName || typeof body.taskQueueName !== "string" || !body.taskQueueName.trim()) {
    return Response.json(
      { error: strings.common.validation.queueRequired },
      { status: 400 }
    )
  }
  const taskQueueName = body.taskQueueName.trim()

  if (body.closeMessage !== undefined && typeof body.closeMessage !== "string") {
    return Response.json(
      { error: strings.common.validation.invalidCloseMessage },
      { status: 400 }
    )
  }

  const closeMessage =
    typeof body.closeMessage === "string" && body.closeMessage.trim()
      ? body.closeMessage.trim()
      : undefined
  if (closeMessage && closeMessage.length > 1600) {
    return Response.json(
      { error: strings.common.validation.invalidCloseMessage },
      { status: 400 }
    )
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  return createSseResponse(req, strings.common.unexpectedError, async (emit, signal) => {
      const { totalSuccess, totalSkipped, totalErrors, partial } =
        await cancelQueueTasks(
          {
            workspaceSid,
            taskQueueName,
            closeMessage,
          },
          client,
          emit,
          signal
        )

      emit(
        sseEvent(
          totalErrors > 0 || partial ? "warning" : "success",
          strings.taskrouter.cancelQueueTasks.log.done(
            totalSuccess,
            totalSkipped,
            totalErrors
          ),
          {
            done: true,
            totalSuccess,
            totalSkipped,
            totalErrors,
            partial,
          }
        )
      )

    }
  )
}
