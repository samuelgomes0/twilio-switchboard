import { listWorkflows } from "@/features/taskrouter/lib/workflows"
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

  if (
    body.pageToken !== undefined &&
    (typeof body.pageToken !== "string" ||
      !body.pageToken ||
      body.pageToken.length > 2048)
  ) {
    return Response.json(
      { error: strings.common.validation.invalidPageToken },
      { status: 400 }
    )
  }
  const pageToken =
    typeof body.pageToken === "string" ? body.pageToken : undefined

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch (error) {
    return toApiResponse(error)
  }

  try {
    return Response.json(
      await listWorkflows(workspaceSid, client, { pageToken })
    )
  } catch (error) {
    return toApiResponse(
      fromTwilioError(error, "taskrouter/workflows/list")
    )
  }
}
