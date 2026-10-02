import assert from "node:assert/strict"
import test from "node:test"
import twilio from "twilio"
import { createLoader } from "./typescript-loader.mjs"

const credentials = { accountSid: `AC${"1".repeat(32)}`, authToken: "2".repeat(32) }
const address = "whatsapp:+5511999999999"
const request = body => new Request("http://localhost/api/conversations/close", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
})
const eventsFrom = text => text.trim().split("\n\n").map(line => JSON.parse(line.slice(5)))

function setup(client) {
  const receivedCredentials = []
  const load = createLoader({
    "@/lib/twilio-client": { getTwilioClient: (...args) => {
      receivedCredentials.push(args)
      return client
    } },
    "@/lib/constants": { MAX_ITEMS: 10, RETRY_ATTEMPTS: 2, RETRY_DELAY_MS: 0 },
  })
  return { POST: load("app/api/conversations/close/route.ts").POST, receivedCredentials }
}

function mockClient(conversations = []) {
  const searches = []
  const writes = []
  const client = { conversations: { v1: {
    participantConversations: { list: async options => {
      searches.push(options)
      return conversations
    } },
    conversations: sid => ({ update: async body => { writes.push({ sid, body }); return {} } }),
  } } }
  return { client, searches, writes }
}

test("close: national, country-prefixed, formatted and saved WhatsApp addresses find the same participant", async () => {
  for (const phone of ["11999999999", "5511999999999", "+5511999999999", address, " (11) 99999-9999 ", "+55 (11) 99999-9999"]) {
    const { client, searches, writes } = mockClient([
      { conversationState: "closed", conversationSid: "CH-closed" },
      { conversationState: "inactive", conversationSid: "CH-inactive" },
      { conversationState: "active", conversationSid: "CH-active" },
    ])
    const { POST, receivedCredentials } = setup(client)
    const response = await POST(request({ participants: [phone], ...credentials }))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("content-type"), "text/event-stream")
    const events = eventsFrom(await response.text())
    assert.equal(searches[0].address, address, phone)
    assert.deepEqual(writes, [{ sid: "CH-active", body: { state: "closed" } }])
    assert.deepEqual(receivedCredentials, [[credentials.accountSid, credentials.authToken]])
    assert.equal(events.at(-1).done, true)
    assert.equal(events.at(-1).totalClosed, 1)
    assert.equal(events.at(-1).totalErrors, 0)
  }
})

test("close: DDD 55 and eight-digit subscriber numbers retain their exact digits", () => {
  const { normalizeClosePhone } = createLoader()("features/conversations/lib/normalize-close-phone.ts")
  for (const [input, expected] of [
    ["55999999999", "whatsapp:+5555999999999"],
    ["5555999999999", "whatsapp:+5555999999999"],
    ["1187654321", "whatsapp:+551187654321"],
    ["551187654321", "whatsapp:+551187654321"],
  ]) assert.equal(normalizeClosePhone(input), expected)
})

test("close: malformed bodies, numbers and credentials fail before any Twilio call", async () => {
  const { POST, receivedCredentials } = setup({})
  for (const body of [
    null, [], "text", {}, { participants: [] }, { participants: "11999999999" },
    ...[null, {}, 11999999999, true, "", "123", "abc11999999999", "551199999999999", "+11999999999", "11999999999/11888888888"]
      .map(phone => ({ participants: ["11999999999", phone] })),
    { participants: Array(11).fill("11999999999") },
    ...[{ accountSid: 12 }, { authToken: {} }, { accountSid: credentials.accountSid }, { ...credentials, authToken: "bad" }]
      .map(value => ({ participants: ["11999999999"], ...value })),
  ]) assert.equal((await POST(request(body))).status, 400, JSON.stringify(body))
  assert.equal((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status, 400)
  assert.deepEqual(receivedCredentials, [])
})

test("close: SDK pagination finds an active conversation after the first 1,000 matches", async () => {
  const client = twilio(credentials.accountSid, credentials.authToken)
  const reads = []
  const writes = []
  const activeSid = `CH${"f".repeat(32)}`
  // Use the real SDK paginator with an in-memory transport; no network or credentials leave this test.
  client.request = async options => {
    if (options.method.toUpperCase() === "POST") {
      writes.push(options)
      return { statusCode: 200, body: { sid: activeSid, state: "closed" }, headers: {} }
    }
    const pageIndex = reads.length
    reads.push(options)
    const last = pageIndex === 20
    return { statusCode: 200, headers: {}, body: {
      conversations: last
        ? [{ conversation_sid: activeSid, conversation_state: "active" }]
        : Array.from({ length: 50 }, (_, index) => ({
          conversation_sid: `CH${(pageIndex * 50 + index).toString(16).padStart(32, "0")}`,
          conversation_state: "closed",
        })),
      meta: { key: "conversations", next_page_url: last ? null : `https://conversations.twilio.com/v1/ParticipantConversations?PageToken=${pageIndex + 1}` },
    } }
  }
  const { POST } = setup(client)
  const events = eventsFrom(await (await POST(request({ participants: ["11999999999"] }))).text())
  assert.equal(reads.length, 21)
  assert.equal(reads[0].params.Address, address)
  assert.equal(reads[0].params.PageSize, 50)
  assert.equal(writes.length, 1)
  assert.ok(writes[0].uri.endsWith(`/Conversations/${activeSid}`))
  assert.deepEqual(writes[0].data, { State: "closed" })
  assert.equal(events.at(-1).totalClosed, 1)
  assert.equal(events.at(-1).done, true)
})

test("close: empty results finish without writes and support environment fallback", async () => {
  const { client, writes } = mockClient()
  const { POST, receivedCredentials } = setup(client)
  const events = eventsFrom(await (await POST(request({ participants: ["11999999999"] }))).text())
  assert.deepEqual(receivedCredentials, [[undefined, undefined]])
  assert.deepEqual(writes, [])
  assert.ok(events.some(event => event.level === "warning"))
  assert.equal(events.at(-1).totalClosed, 0)
  assert.equal(events.at(-1).totalErrors, 0)
  assert.equal(events.at(-1).done, true)
})

test("close: failed searches are reported as errors rather than no matches", async () => {
  const { client, writes } = mockClient()
  client.conversations.v1.participantConversations.list = async () => { throw new Error(credentials.authToken) }
  const { POST } = setup(client)
  const text = await (await POST(request({ participants: ["11999999999"] }))).text()
  const events = eventsFrom(text)
  assert.equal(text.includes(credentials.authToken), false)
  assert.deepEqual(writes, [])
  assert.equal(events.at(-1).totalErrors, 1)
  assert.equal(events.at(-1).done, true)
})
