import { strings } from "@/lib/strings"
import { fetchWorker } from "@/features/taskrouter/lib/fetch-worker"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: {
    workspaceSid?: unknown
    identifier?: unknown
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
  const identifier =
    typeof body.identifier === "string" ? body.identifier.trim() : ""

  if (!workspaceSid) {
    return Response.json(
      { error: strings.common.validation.workspaceRequired },
      { status: 400 }
    )
  }

  if (!identifier) {
    return Response.json(
      { error: strings.common.validation.identifierRequired },
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
    const data = await fetchWorker(workspaceSid, identifier, client)
    if (!data) {
      return Response.json(
        { error: strings.taskrouter.assignWorkers.log.notFound(identifier) },
        { status: 404 }
      )
    }
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "taskrouter/fetch-worker")
    if (appErr.kind === "not_found") {
      return Response.json(
        { error: strings.taskrouter.assignWorkers.log.notFound(identifier) },
        { status: 404 }
      )
    }
    return toApiResponse(appErr)
  }
}
