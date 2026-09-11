import { strings } from "@/lib/strings"
import twilio from "twilio"
import { AppError } from "@/lib/errors"

function getTwilioClient(accountSid?: string, authToken?: string) {
  const sid = accountSid ?? process.env.TWILIO_ACCOUNT_SID
  const token = authToken ?? process.env.TWILIO_AUTH_TOKEN

  if (!sid || !token)
    throw new AppError("auth", strings.common.errors.missingCredentials)

  return twilio(sid, token)
}

export { getTwilioClient }
