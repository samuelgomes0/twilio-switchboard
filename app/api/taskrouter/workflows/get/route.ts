import { getWorkflow } from "@/features/taskrouter/lib/workflows"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import {
  isTwilioSid,
  parseTwilioCredentials,
  readJsonObject,
} from "@/lib/request-validation"
import { strings } from "@/lib/strings"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

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

  const workspaceSid =
    typeof body.workspaceSid === "string" ? body.workspaceSid.trim() : ""
  if (!workspaceSid) {
    return Response.json(
      { error: strings.common.validation.workspaceRequired },
      { status: 400 }
    )
  }
  if (!isTwilioSid(workspaceSid, "WS")) {
    return Response.json(
      { error: strings.common.validation.invalidWorkspaceSid },
      { status: 400 }
    )
  }

  const workflowSid =
    typeof body.workflowSid === "string" ? body.workflowSid.trim() : ""
  if (!workflowSid) {
    return Response.json(
      { error: strings.common.validation.workflowSidRequired },
      { status: 400 }
    )
  }
  if (!isTwilioSid(workflowSid, "WW")) {
    return Response.json(
      { error: strings.common.validation.invalidWorkflowSid },
      { status: 400 }
    )
  }

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch (error) {
    return toApiResponse(error)
  }

  try {
    return Response.json({
      workflow: await getWorkflow(workspaceSid, workflowSid, client),
    })
  } catch (error) {
    const appError = fromTwilioError(error, "taskrouter/workflows/get")
    if (appError.kind === "not_found") {
      return Response.json(
        { error: strings.taskrouter.workflows.details.notFound },
        { status: 404 }
      )
    }
    return toApiResponse(appError)
  }
}
