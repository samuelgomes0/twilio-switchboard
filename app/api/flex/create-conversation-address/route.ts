import { strings } from "@/lib/strings"
import { createAddressConfig } from "@/features/flex/lib/create-address-config"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"
import { validateCreateAddressConfig } from "@/features/flex/lib/validate-create-address-config"
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
  const input = validateCreateAddressConfig(body)
  if (!credentials) {
    return Response.json(
      { error: strings.common.validation.invalidCredentials },
      { status: 400 }
    )
  }
  if (!input) {
    return Response.json(
      { error: strings.common.validation.invalidBody },
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
    const data = await createAddressConfig(input, client)
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "flex/create-conversation-address")
    if (appErr.kind === "conflict") {
      return Response.json(
        {
          error:
            strings.flex.createAddressConfig.log.alreadyConfigured(input.address),
        },
        { status: 409 }
      )
    }
    return toApiResponse(appErr)
  }
}
