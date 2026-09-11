import { strings } from "@/lib/strings"
import { fetchTask } from "@/features/taskrouter/lib/fetch-task"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    workspaceSid?: unknown
    taskSid?: unknown
    accountSid?: string
    authToken?: string
  }
  try {
    body = await req.json()
  } catch {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
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
    client = getTwilioClient(body.accountSid, body.authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    const data = await fetchTask(workspaceSid, taskSid, client)
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "taskrouter/fetch-task")
    if (appErr.kind === "not_found") {
      return Response.json(
        { error: strings.taskrouter.searchTasks.log.taskNotFound(taskSid) },
        { status: 404 }
      )
    }
    return toApiResponse(appErr)
  }
}
