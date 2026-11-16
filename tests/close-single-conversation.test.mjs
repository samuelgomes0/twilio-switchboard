import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const SID = "CH" + "1".repeat(32)
const ACCOUNT = "AC" + "2".repeat(32)
const TOKEN = "3".repeat(32)
const { closeConversation } = createLoader()("features/conversations/lib/close-conversation.ts")

function fixture(state = "active", afterFetch = () => {}) {
  const writes = []
  const reads = []
  const client = { conversations: { v1: { conversations: sid => {
    reads.push(sid)
    return {
      fetch: async () => { afterFetch(); return { sid, state, dateUpdated: null } },
      update: async options => { writes.push({ sid, ...options }); return { sid, state: "closed", dateUpdated: new Date("2026-10-06T12:00:00Z") } },
    }
  } } } }
  return { client, writes, reads }
}

test("closes only the selected active Conversation and returns its updated state", async () => {
  const { client, writes, reads } = fixture()
  const result = await closeConversation(SID, client, new AbortController().signal)
  assert.deepEqual(reads, [SID])
  assert.deepEqual(writes, [{ sid: SID, state: "closed" }])
  assert.equal(result.closed, true)
  assert.equal(result.state, "closed")
})

test("inactive, closed and unknown states never receive a write", async () => {
  for (const state of ["inactive", "closed", "initializing", undefined]) {
    const { client, writes } = fixture(state === undefined ? null : state)
    const result = await closeConversation(SID, client, new AbortController().signal)
    assert.equal(result.closed, false)
    assert.equal(writes.length, 0)
  }
})

test("cancellation before the read or after the read prevents writes", async () => {
  for (const early of [true, false]) {
    const controller = new AbortController()
    const { client, writes, reads } = fixture("active", () => controller.abort())
    if (early) controller.abort()
    const result = await closeConversation(SID, client, controller.signal)
    assert.ok(result.error)
    assert.equal(writes.length, 0)
    assert.equal(reads.length, early ? 0 : 1)
  }
})

test("Twilio failures return generic errors without leaking secrets or retrying a write", async () => {
  let writes = 0
  const client = { conversations: { v1: { conversations: () => ({
    fetch: async () => ({ state: "active" }),
    update: async () => { writes++; throw new Error("secret token and stack") },
  }) } } }
  const result = await closeConversation(SID, client, new AbortController().signal)
  assert.ok(result.error)
  assert.ok(!result.error.includes("secret"))
  assert.equal(writes, 1)
})

test("POST rejects invalid inputs before creating the client", async () => {
  let created = 0
  const { POST } = createLoader({ "@/lib/twilio-client": { getTwilioClient: () => { created++; throw new Error() } } })("app/api/conversations/close-single/route.ts")
  for (const input of [null, [], {}, { sid: "bad" }, { sid: SID, accountSid: ACCOUNT }, { sid: SID, accountSid: "bad", authToken: TOKEN }, { sid: SID, accountSid: ACCOUNT, authToken: 1 }]) {
    assert.equal((await POST(new Request("http://localhost/api", { method: "POST", body: JSON.stringify(input) }))).status, 400)
  }
  assert.equal((await POST(new Request("http://localhost/api", { method: "POST", body: "{" }))).status, 400)
  assert.equal(created, 0)
})

test("POST forwards credentials and reports credential failures as 500", async () => {
  const credentials = []
  const { client } = fixture()
  const { POST } = createLoader({ "@/lib/twilio-client": { getTwilioClient: (...args) => { credentials.push(args); return client } } })("app/api/conversations/close-single/route.ts")
  const success = await POST(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ sid: SID, accountSid: ACCOUNT, authToken: TOKEN }) }))
  assert.equal(success.status, 200)
  assert.equal((await success.json()).state, "closed")
  assert.deepEqual(credentials, [[ACCOUNT, TOKEN]])
  const failure = createLoader({ "@/lib/twilio-client": { getTwilioClient: () => { throw new Error("secret") } } })("app/api/conversations/close-single/route.ts")
  const response = await failure.POST(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ sid: SID, accountSid: ACCOUNT, authToken: TOKEN }) }))
  assert.equal(response.status, 500)
  assert.ok(!(await response.text()).includes("secret"))
})

test("client prevents duplicate submissions and ignores a response after unmount", async () => {
  let cleanup
  let resolveResponse
  const originalFetch = globalThis.fetch
  const updates = []
  const requests = []
  const { useCloseConversation } = createLoader({
    react: { useState: value => [value, () => {}], useRef: value => ({ current: value }), useEffect: effect => { cleanup = effect() } },
    "@/features/environments/context": { useEnvironment: () => ({ activeEnvironment: { accountSid: ACCOUNT, authToken: TOKEN } }) },
  })("features/conversations/components/use-close-conversation.ts")
  globalThis.fetch = (url, options) => { requests.push({ url, options }); return new Promise(resolve => { resolveResponse = resolve }) }
  try {
    const hook = useCloseConversation(SID, result => updates.push(result))
    const closing = hook.close()
    await hook.close()
    assert.equal(requests.length, 1)
    assert.equal(JSON.parse(requests[0].options.body).sid, SID)
    cleanup()
    assert.equal(requests[0].options.signal.aborted, true)
    resolveResponse({ ok: true, json: async () => ({ sid: SID, state: "closed", closed: true }) })
    await closing
    assert.deepEqual(updates, [])
  } finally { globalThis.fetch = originalFetch }
})
