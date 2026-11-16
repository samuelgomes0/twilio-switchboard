import {
  parseUpdateWorkflowInput,
  updateWorkflow,
} from "@/features/taskrouter/lib/update-workflow"
import { AppError, fromTwilioError, toApiResponse } from "@/lib/errors"
import { parseTwilioCredentials, readJsonObject } from "@/lib/request-validation"
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

  const input = parseUpdateWorkflowInput(body)
  if (!input) {
    return Response.json(
      { error: strings.taskrouter.workflows.edit.invalidInput },
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
    return Response.json(await updateWorkflow(input, client))
  } catch (error) {
    return toApiResponse(
      error instanceof AppError
        ? error
        : fromTwilioError(error, "taskrouter/workflows/update")
    )
  }
}
