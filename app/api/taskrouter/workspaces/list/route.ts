import { listWorkspaces } from "@/features/taskrouter/lib/workspaces"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import {
  parseTwilioCredentials,
  readJsonObject,
} from "@/lib/request-validation"
import { strings } from "@/lib/strings"
import { getTwilioClient } from "@/lib/twilio-client"

export async function POST(request: Request) {
  const body = await readJsonObject(request)
  if (!body)
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  const credentials = parseTwilioCredentials(body)
  if (!credentials)
    return Response.json(
      { error: strings.common.validation.invalidCredentials },
      { status: 400 }
    )
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
  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(credentials.accountSid, credentials.authToken)
  } catch (error) {
    return toApiResponse(error)
  }
  try {
    return Response.json(
      await listWorkspaces(
        client,
        typeof body.pageToken === "string" ? body.pageToken : undefined
      )
    )
  } catch (error) {
    return toApiResponse(fromTwilioError(error, "taskrouter/workspaces/list"))
  }
}
