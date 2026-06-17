import twilio from "twilio"
import { AppError } from "@/lib/errors"

function getTwilioClient(accountSid?: string, authToken?: string) {
  const sid = accountSid ?? process.env.TWILIO_ACCOUNT_SID
  const token = authToken ?? process.env.TWILIO_AUTH_TOKEN

  if (!sid || !token)
    throw new AppError(
      "auth",
      "Credenciais não configuradas. Selecione um ambiente."
    )

  return twilio(sid, token)
}

export { getTwilioClient }
