import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

test("getTwilioClient rejeita credenciais ausentes sem usar variáveis do servidor", () => {
  let clientCreations = 0
  const { getTwilioClient } = createLoader({
    twilio: {
      default: () => {
        clientCreations++
        return {}
      },
    },
  })("lib/twilio-client.ts")

  const previousAccountSid = process.env.TWILIO_ACCOUNT_SID
  const previousAuthToken = process.env.TWILIO_AUTH_TOKEN
  process.env.TWILIO_ACCOUNT_SID = "ACserver"
  process.env.TWILIO_AUTH_TOKEN = "server-secret"

  try {
    assert.throws(
      () => getTwilioClient(),
      (error) => error?.kind === "auth",
    )
    assert.equal(clientCreations, 0)
  } finally {
    if (previousAccountSid === undefined) delete process.env.TWILIO_ACCOUNT_SID
    else process.env.TWILIO_ACCOUNT_SID = previousAccountSid

    if (previousAuthToken === undefined) delete process.env.TWILIO_AUTH_TOKEN
    else process.env.TWILIO_AUTH_TOKEN = previousAuthToken
  }
})

test("getTwilioClient encaminha somente as credenciais recebidas", () => {
  const calls = []
  const client = {}
  const { getTwilioClient } = createLoader({
    twilio: {
      default: (...credentials) => {
        calls.push(credentials)
        return client
      },
    },
  })("lib/twilio-client.ts")

  assert.equal(getTwilioClient("ACrequest", "request-secret"), client)
  assert.deepEqual(calls, [["ACrequest", "request-secret"]])
})
