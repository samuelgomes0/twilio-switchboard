import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const privateDetail = "upstream-private-detail"
const credentials = {
  accountSid: `AC${"1".repeat(32)}`,
  authToken: "2".repeat(32),
}

function mockStorage(t, initial = {}) {
  const descriptors = ["window", "localStorage"].map((key) =>
    [key, Object.getOwnPropertyDescriptor(globalThis, key)]
  )
  const values = new Map(Object.entries(initial))
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} })
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage })
  t.after(() => {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  return { values, storage }
}

test("storage readers validate shapes, enforce limits and recover from malformed JSON", (t) => {
  const { values, storage } = mockStorage(t)
  const load = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })
  const { readVariables } = load("lib/variables.ts")
  const { readHistory } = load("lib/operation-history.ts")
  for (const read of [readVariables, readHistory]) {
    for (const raw of ["", "{broken", "[]"]) {
      values.set("key", raw)
      assert.deepEqual(read("key"), [])
    }
    assert.deepEqual(read("missing"), [])
  }
  const variables = Array.from({ length: 12 }, (_, i) => `valor-${i}`)
  values.set("key", JSON.stringify(variables))
  assert.deepEqual(readVariables("key"), variables.slice(0, 10))
  const history = Array.from({ length: 7 }, (_, i) => ({ value: i }))
  values.set("key", JSON.stringify(history))
  assert.deepEqual(readHistory("key"), history.slice(0, 5))
  storage.getItem = () => { throw new Error("denied") }
  assert.deepEqual(readVariables("key"), [])
  assert.deepEqual(readHistory("key"), [])
})

test("autocomplete preserves order, deduplication, limits and individual deletion", (t) => {
  const { values } = mockStorage(t, { key: JSON.stringify(["a", "b", "a"]) })
  const { addVariable, deleteVariable } = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })("lib/variables.ts")
  assert.deepEqual(addVariable("key", " a "), ["a", "b"])
  assert.deepEqual(deleteVariable("key", "a"), ["b"])
  const special = 'ação\n"texto" 😀'
  assert.deepEqual(addVariable("key", special), [special, "b"])
  assert.deepEqual(JSON.parse(values.get("key")), [special, "b"])
  values.set("key", JSON.stringify(Array.from({ length: 10 }, (_, i) => String(i))))
  assert.deepEqual(addVariable("key", "new"), ["new", ...Array.from({ length: 9 }, (_, i) => String(i))])
})

test("autocomplete mutations reread storage to preserve concurrent writes", (t) => {
  const { values } = mockStorage(t, { key: '["other-instance"]' })
  const { addVariable, deleteVariable } = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })("lib/variables.ts")
  assert.deepEqual(addVariable("key", "new"), ["new", "other-instance"])
  values.set("key", '["new","other-instance","concurrent"]')
  assert.deepEqual(deleteVariable("key", "new"), ["other-instance", "concurrent"])
  assert.equal(values.get("key"), '["other-instance","concurrent"]')
})

test("autocomplete keeps global and environment keys isolated", (t) => {
  const { values } = mockStorage(t)
  const { addVariable, readVariables } = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })("lib/variables.ts")
  addVariable("key", "global")
  addVariable("key", "env-a", "a")
  addVariable("key", "env-b", "b")
  assert.deepEqual(readVariables("key", ""), ["global"])
  assert.deepEqual(readVariables("key", "a"), ["env-a"])
  assert.deepEqual(readVariables("key", "b"), ["env-b"])
  assert.equal(values.get("key"), '["global"]')
  assert.equal(values.get("key:a"), '["env-a"]')
  values.set("key:", '["explicit-empty-suffix"]')
  assert.deepEqual(readVariables("key:"), ["explicit-empty-suffix"])
})

test("operation history prepends without deduplication and preserves entry payloads", (t) => {
  const entry = { ts: 1, mode: "sid", attributes: 'ação\n"😀"', extra: null }
  const { values } = mockStorage(t, { key: JSON.stringify([entry, 2, 3, 4, 5]), other: "[]" })
  const { pushHistory, readHistory } = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })("lib/operation-history.ts")
  assert.equal(pushHistory("key", entry), undefined)
  assert.deepEqual(readHistory("key"), [entry])
  assert.equal(values.get("other"), "[]")
  assert.equal(values.get("key"), JSON.stringify([entry]))
})

test("storage write failures preserve return values and do not escape history writes", (t) => {
  const { storage } = mockStorage(t, { key: '["old"]' })
  storage.setItem = () => { throw new Error("quota") }
  const load = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })
  const { addVariable, deleteVariable } = load("lib/variables.ts")
  const { pushHistory } = load("lib/operation-history.ts")
  assert.deepEqual(addVariable("key", "new"), ["new", "old"])
  assert.deepEqual(deleteVariable("key", "old"), [])
  assert.doesNotThrow(() => pushHistory("key", { ts: 2 }))
})

test("readers avoid storage during SSR and tolerate unavailable browser storage", (t) => {
  const { storage } = mockStorage(t)
  let reads = 0
  storage.getItem = () => { reads++; throw new Error("unavailable") }
  delete globalThis.window
  const load = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })
  const { readVariables } = load("lib/variables.ts")
  const { readHistory, pushHistory } = load("lib/operation-history.ts")
  assert.deepEqual(readVariables("key"), [])
  assert.deepEqual(readHistory("key"), [])
  assert.equal(reads, 0)
  delete globalThis.localStorage
  assert.doesNotThrow(() => pushHistory("key", "new"))
})

test("valid JSON with unexpected shape falls back safely before the next write", (t) => {
  const { values } = mockStorage(t)
  const load = createLoader({ "./stored-keys": createLoader()("lib/stored-keys.ts") })
  const { readVariables } = load("lib/variables.ts")
  const { readHistory, pushHistory } = load("lib/operation-history.ts")
  for (const raw of ["null", "{}", "42"]) {
    values.set("key", raw)
    assert.deepEqual(readVariables("key"), [])
    assert.deepEqual(readHistory("key"), [])
    assert.doesNotThrow(() => pushHistory("key", { value: "new" }))
    assert.equal(values.get("key"), '[{"value":"new"}]')
  }
})

test("channel classification prioritizes sender attributes over the Task channel", () => {
  const { inferChannel } = createLoader()("features/taskrouter/lib/infer-channel.ts")
  assert.equal(inferChannel('{"from":"whatsapp:+5511999999999"}', "voice"), "whatsapp")
  assert.equal(inferChannel('{"from":"+5511999999999"}', "chat"), "voice")
  assert.equal(inferChannel('{"from":"5511999999999"}', null), "voice")
})

test("channel classification tolerates malformed or missing sender attributes", () => {
  const { inferChannel } = createLoader()("features/taskrouter/lib/infer-channel.ts")
  for (const attributes of ["invalid", "null", "[]", "{}", '{"from":123}', '{"from":"agent@example.com"}']) {
    assert.equal(inferChannel(attributes, "voice"), "voice")
    assert.equal(inferChannel(attributes, "chat"), "unknown")
    assert.equal(inferChannel(attributes, null), "unknown")
  }
})

test("channel classification preserves exact matching without normalizing sender text", () => {
  const { inferChannel } = createLoader()("features/taskrouter/lib/infer-channel.ts")
  for (const from of ["WHATSAPP:+5511999999999", " +5511999999999", "5511-99999999", ""]) {
    assert.equal(inferChannel(JSON.stringify({ from }), null), "unknown")
  }
})

const request = (body) =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ ...body, ...credentials }),
    headers: { "Content-Type": "application/json" },
  })
const eventsFrom = (text) =>
  text
    .trim()
    .split("\n\n")
    .map((event) => JSON.parse(event.slice(6)))

test("shared errors sanitize responses and logs, including non-Error throws", async (t) => {
  const log = t.mock.method(console, "error", () => {})
  const load = createLoader()
  const { fromTwilioError, toApiResponse, sanitizeExternalError } =
    load("lib/errors.ts")
  for (const error of [
    null,
    undefined,
    privateDetail,
    new Error(privateDetail),
    { status: 403, code: 20003, message: privateDetail },
  ]) {
    const response = toApiResponse(fromTwilioError(error, "test"))
    assert.equal((await response.text()).includes(privateDetail), false)
    assert.equal(sanitizeExternalError(error).includes(privateDetail), false)
  }
  assert.equal(
    (await toApiResponse(new Error(privateDetail)).text()).includes(
      privateDetail
    ),
    false
  )
  assert.equal(
    JSON.stringify(log.mock.calls.map((call) => call.arguments)).includes(
      privateDetail
    ),
    false
  )
})

test("retry emits localized warnings and final failure without upstream details", async () => {
  const load = createLoader()
  const { withRetry } = load("features/conversations/lib/close.ts")
  const events = []
  let attempts = 0
  const result = await withRetry(
    async () => {
      attempts++
      throw new Error(privateDetail)
    },
    2,
    0,
    "Consulta",
    (event) => events.push(...eventsFrom(event))
  )
  assert.equal(result, null)
  assert.equal(attempts, 2)
  assert.deepEqual(
    events.map((event) => event.level),
    ["warning", "error"]
  )
  assert.equal(JSON.stringify(events).includes(privateDetail), false)
})

test("closing conversations retains the update and final SSE totals", async () => {
  const writes = []
  const client = {
    conversations: {
      v1: {
        participantConversations: {
          list: async () => [
            { conversationState: "active", conversationSid: "CH-test" },
          ],
        },
        conversations: (sid) => ({
          update: async (body) => {
            writes.push({ sid, body })
            return {}
          },
        }),
      },
    },
  }
  const load = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })
  const { POST } = load("app/api/conversations/close/route.ts")
  const response = await POST(request({ participants: ["1187654321"] }))
  const events = eventsFrom(await response.text())
  assert.deepEqual(writes, [{ sid: "CH-test", body: { state: "closed" } }])
  assert.equal(events.at(-1).done, true)
  assert.equal(events.at(-1).totalClosed, 1)
  assert.equal(events.at(-1).totalErrors, 0)
})
