import { strings } from "@/lib/strings"
import { fetchWorker } from "@/features/taskrouter/lib/fetch-worker"
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
  const identifier =
    typeof body.identifier === "string" ? body.identifier.trim() : ""

  if (!workspaceSid) {
    return Response.json(
      { error: strings.common.validation.workspaceRequired },
      { status: 400 }
    )
  }
  if (!isTwilioSid(workspaceSid, "WS")) {
    return Response.json({ error: strings.common.validation.invalidWorkspaceSid }, { status: 400 })
  }

  if (!identifier) {
    return Response.json(
      { error: strings.common.validation.identifierRequired },
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
    const data = await fetchWorker(workspaceSid, identifier, client)
    if (!data) {
      return Response.json(
        { error: strings.taskrouter.assignWorkers.log.notFound(identifier) },
        { status: 404 }
      )
    }
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "taskrouter/get-worker-details")
    if (appErr.kind === "not_found") {
      return Response.json(
        { error: strings.taskrouter.assignWorkers.log.notFound(identifier) },
        { status: 404 }
      )
    }
    return toApiResponse(appErr)
  }
}
