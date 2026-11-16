import { strings } from "@/lib/strings"
import { searchTasks } from "@/features/taskrouter/lib/search-tasks"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import { parseTwilioCredentials, readJsonObject } from "@/lib/request-validation"

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
  const phoneNumber =
    typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : ""

  if (!workspaceSid) {
    return Response.json(
      { error: strings.common.validation.workspaceRequired },
      { status: 400 }
    )
  }

  if (!phoneNumber) {
    return Response.json(
      { error: strings.common.validation.phoneRequired },
      { status: 400 }
    )
  }

  if (!/^(?:whatsapp:)?\+?[1-9]\d{7,14}$/.test(phoneNumber.replace(/[\s().-]/g, ""))) {
    return Response.json(
      { error: strings.common.validation.invalidPhone },
      { status: 400 }
    )
  }

  if (!/^WS[a-f0-9]{32}$/i.test(workspaceSid)) {
    return Response.json(
      { error: strings.common.validation.invalidWorkspaceSid },
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
    const data = await searchTasks(workspaceSid, phoneNumber, client)
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "taskrouter/search-tasks-by-number")
    if (appErr.kind === "not_found") {
      return Response.json(
        {
          error:
            strings.taskrouter.searchTasks.log.workspaceNotFound(workspaceSid),
        },
        { status: 404 }
      )
    }
    return toApiResponse(appErr)
  }
}
