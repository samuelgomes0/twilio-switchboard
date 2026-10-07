import { strings } from "@/lib/strings"
import { fetchTask } from "@/features/taskrouter/lib/fetch-task"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
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
    return Response.json({ error: strings.common.validation.invalidCredentials }, { status: 400 })
  }

  const workspaceSid =
    typeof body.workspaceSid === "string" ? body.workspaceSid.trim() : ""
  const taskSid = typeof body.taskSid === "string" ? body.taskSid.trim() : ""

  if (!workspaceSid) {
    return Response.json(
      { error: strings.common.validation.workspaceRequired },
      { status: 400 }
    )
  }
  if (!isTwilioSid(workspaceSid, "WS")) {
    return Response.json({ error: strings.common.validation.invalidWorkspaceSid }, { status: 400 })
  }

  if (!taskSid) {
    return Response.json(
      { error: strings.common.validation.taskRequired },
      { status: 400 }
    )
  }

  if (!/^WT[a-f0-9]{32}$/i.test(taskSid)) {
    return Response.json(
      { error: strings.common.validation.invalidTaskSid },
      { status: 400 }
    )
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    const data = await fetchTask(workspaceSid, taskSid, client)
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "taskrouter/get-task-by-sid")
    if (appErr.kind === "not_found") {
      return Response.json(
        { error: strings.taskrouter.searchTasks.log.taskNotFound(taskSid) },
        { status: 404 }
      )
    }
    return toApiResponse(appErr)
  }
}
