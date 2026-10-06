import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const { searchParticipantPages } = createLoader()("features/conversations/lib/search-participant-pages.ts")
const conversation = (sid, state, updated = "2026-10-01T00:00:00Z") => ({ conversationSid: sid, conversationState: state, conversationDateUpdated: updated })

test("loads sequentially through the final page, deduplicates and prioritizes late active matches", async () => {
  const tokens = []
  const progress = []
  const pages = [
    { conversations: [conversation("closed", "closed"), conversation("duplicate", "closed")], nextPageToken: "second" },
    { conversations: [conversation("old", "active"), conversation("duplicate", "active", "2026-10-02T00:00:00Z")], nextPageToken: "third" },
    { conversations: [conversation("new", "active", "2026-10-03T00:00:00Z")], nextPageToken: null },
  ]
  const results = await searchParticipantPages(async token => {
    tokens.push(token)
    return pages[tokens.length - 1]
  }, new AbortController().signal, (results, count) => progress.push({ results, count }))
  assert.deepEqual(tokens, [undefined, "second", "third"])
  assert.deepEqual(results.map(c => c.conversationSid), ["new", "duplicate", "old", "closed"])
  assert.deepEqual(progress.map(p => p.count), [1, 2, 3])
  assert.equal(progress[0].results.length, 2)
})

test("cancellation prevents the next page request", async () => {
  const controller = new AbortController()
  let calls = 0
  await assert.rejects(searchParticipantPages(async () => {
    calls++
    return { conversations: [], nextPageToken: "more" }
  }, controller.signal, () => controller.abort()), { name: "AbortError" })
  assert.equal(calls, 1)
})

test("late responses after cancellation do not update results", async () => {
  const controller = new AbortController()
  let updates = 0
  await assert.rejects(searchParticipantPages(async () => {
    controller.abort()
    return { conversations: [conversation("late", "active")], nextPageToken: null }
  }, controller.signal, () => updates++), { name: "AbortError" })
  assert.equal(updates, 0)
})

test("empty searches complete and page failures preserve earlier progress without claiming completion", async () => {
  assert.deepEqual(await searchParticipantPages(async () => ({ conversations: [], nextPageToken: null }), new AbortController().signal, () => {}), [])
  let calls = 0
  const updates = []
  await assert.rejects(searchParticipantPages(async () => {
    if (++calls === 2) throw new Error("failure")
    return { conversations: [conversation("first", "active")], nextPageToken: "next" }
  }, new AbortController().signal, results => updates.push(results)))
  assert.equal(updates.length, 1)
})

test("repeated page tokens cannot cause an endless search", async () => {
  let calls = 0
  await assert.rejects(searchParticipantPages(async () => {
    calls++
    return { conversations: [], nextPageToken: "same" }
  }, new AbortController().signal, () => {}))
  assert.equal(calls, 2)
})

test("route validates malformed input and credentials before creating a Twilio client", async () => {
  let clients = 0
  const { POST } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => { clients++; throw new Error("secret") } },
  })("app/api/conversations/fetch-by-participant/route.ts")
  for (const body of [null, [], {}, { address: "arbitrary" }, { address: "whatsapp:+5511999999999", pageToken: {} }, { address: "whatsapp:+5511999999999", accountSid: "invalid", authToken: "invalid" }, { address: "whatsapp:+5511999999999", accountSid: "AC" + "1".repeat(32) }]) {
    const response = await POST(new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body) }))
    assert.equal(response.status, 400)
    assert.ok(!(await response.text()).includes("secret"))
  }
  assert.equal(clients, 0)
})

test("route forwards credentials and pagination, requesting the maximum participant page size", async () => {
  const options = []
  const credentials = []
  const client = { conversations: { v1: { participantConversations: { page: async value => {
    options.push(value)
    return { instances: [conversation("closed", "closed"), conversation("active", "active")], nextPageUrl: "https://conversations.twilio.com/v1/ParticipantConversations?PageToken=next" }
  } } } } }
  const { POST } = createLoader({ "@/lib/twilio-client": { getTwilioClient: (...args) => { credentials.push(args); return client } } })("app/api/conversations/fetch-by-participant/route.ts")
  const accountSid = "AC" + "1".repeat(32)
  const authToken = "2".repeat(32)
  const response = await POST(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ address: "whatsapp:+5511999999999", pageToken: "current", accountSid, authToken }) }))
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.deepEqual(options, [{ address: "whatsapp:+5511999999999", pageSize: 50, pageToken: "current" }])
  assert.deepEqual(credentials, [[accountSid, authToken]])
  assert.deepEqual(result.conversations.map(c => c.conversationSid), ["active", "closed"])
  assert.equal(result.nextPageToken, "next")
})
