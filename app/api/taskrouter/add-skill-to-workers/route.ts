import { strings } from "@/lib/strings"
import { assignWorkersToQueue } from "@/features/taskrouter/lib/assign-workers"
import { sseEvent } from "@/lib/sse-event"
import { MAX_ITEMS } from "@/lib/constants"
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

  if (!body.skill || typeof body.skill !== "string" || !body.skill.trim()) {
    return Response.json(
      { error: strings.common.validation.skillRequired },
      { status: 400 }
    )
  }
  const skill = body.skill.trim()

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
      { error: strings.taskrouter.assignWorkers.log.invalidWorkers(MAX_ITEMS) },
      { status: 400 }
    )
  }

  const emails = [
    ...new Set((body.emails as string[]).map((email) => email.trim())),
  ]

  const level = body.level === undefined || body.level === null ? null : Number(body.level)
  if (level !== null && (!Number.isFinite(level) || level < 0 || level > 5)) {
    return Response.json(
      { error: strings.common.validation.invalidSkillLevel },
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
      emit(
        sseEvent(
          "info",
          strings.taskrouter.assignWorkers.log.start(emails.length)
        )
      )

      const { totalUpdated, totalSkipped, totalErrors } =
        await assignWorkersToQueue(
          {
            workspaceSid,
            skill,
            level,
            emails,
          },
          client,
          emit,
          signal
        )

      emit(
        sseEvent(
          totalErrors > 0 ? "warning" : "success",
          strings.taskrouter.assignWorkers.log.done(
            totalUpdated,
            totalSkipped,
            totalErrors
          ),
          {
            done: true,
            totalUpdated,
            totalSkipped,
            totalErrors,
          }
        )
      )

    }
  )
}
