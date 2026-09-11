import { strings } from "@/lib/strings"
import { createAddressConfig } from "@/features/flex/lib/create-address-config"
import { fromTwilioError, toApiResponse } from "@/lib/errors"
import { getTwilioClient } from "@/lib/twilio-client"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return Response.json(
      { error: strings.common.validation.invalidBody },
      { status: 400 }
    )
  }

  const address = typeof body.address === "string" ? body.address.trim() : ""
  const type = typeof body.type === "string" ? body.type.trim() : ""

  if (!address) {
    return Response.json(
      { error: strings.common.validation.addressRequired },
      { status: 400 }
    )
  }
  if (!type) {
    return Response.json(
      { error: strings.common.validation.typeRequired },
      { status: 400 }
    )
  }

  const accountSid =
    typeof body.accountSid === "string" ? body.accountSid : undefined
  const authToken =
    typeof body.authToken === "string" ? body.authToken : undefined

  let client: ReturnType<typeof getTwilioClient>
  try {
    client = getTwilioClient(accountSid, authToken)
  } catch (err) {
    return toApiResponse(err)
  }

  try {
    const data = await createAddressConfig(
      body as unknown as Parameters<typeof createAddressConfig>[0],
      client
    )
    return Response.json(data)
  } catch (err) {
    const appErr = fromTwilioError(err, "flex/create-address-config")
    if (appErr.kind === "conflict") {
      return Response.json(
        {
          error:
            strings.flex.createAddressConfig.log.alreadyConfigured(address),
        },
        { status: 409 }
      )
    }
    return toApiResponse(appErr)
  }
}
