import twilio from "twilio"

function getTwilioClient(accountSid?: string, authToken?: string) {
  const sid = accountSid ?? process.env.TWILIO_ACCOUNT_SID
  const token = authToken ?? process.env.TWILIO_AUTH_TOKEN

  if (!sid || !token)
    throw new Error(
      "Missing Twilio credentials. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local or select an environment."
    )

  return twilio(sid, token)
}

export { getTwilioClient }
