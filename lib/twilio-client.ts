import { strings } from "@/lib/strings"
import twilio from "twilio"
import { AppError } from "@/lib/errors"

function getTwilioClient(accountSid?: string, authToken?: string) {
  if (!accountSid || !authToken)
    throw new AppError("auth", strings.common.errors.missingCredentials)

  return twilio(accountSid, authToken)
}

export { getTwilioClient }
