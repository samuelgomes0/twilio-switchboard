import { previewWorkflowCsv } from "@/features/taskrouter/lib/create-workflow"
import { AppError, fromTwilioError, toApiResponse } from "@/lib/errors"
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

  if (typeof body.csvContent !== "string" || !body.csvContent.trim()) {
    return Response.json(
      { error: strings.common.validation.csvRequired },
      { status: 400 }
    )
  }
  if (body.csvContent.length > 1_000_000) {
    return Response.json(
      { error: strings.common.validation.csvTooLarge },
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
    return Response.json(
      await previewWorkflowCsv(
        { workspaceSid, csvContent: body.csvContent },
        client
      )
    )
  } catch (error) {
    return toApiResponse(
      error instanceof AppError
        ? error
        : fromTwilioError(error, "taskrouter/workflows/preview-import")
    )
  }
}
