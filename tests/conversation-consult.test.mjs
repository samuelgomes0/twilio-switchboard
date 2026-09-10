import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import test from "node:test"
import ts from "typescript"

const require = createRequire(import.meta.url)
function load(relative, overrides = {}) {
  const source = ts.transpileModule(readFileSync(path.resolve(relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  const localRequire = id => {
    if (id in overrides) return overrides[id]
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`, overrides)
    return require(id)
  }
  new Function("require", "exports", source)(localRequire, exports)
  return exports
}

const sid = `CH${"0".repeat(32)}`
const credentials = { accountSid: `AC${"1".repeat(32)}`, authToken: "2".repeat(32) }

const { isCustomerMessage } = load("features/conversations/lib/is-customer-message.ts")
const participants = [
  { sid: "MB-customer", messagingBinding: { address: "whatsapp:+5511999999999", proxy_address: "whatsapp:+5511888888888" } },
  { sid: "MB-agent", messagingBinding: null },
]

test("message alignment identifies customers by participant or known channel address", () => {
  assert.equal(isCustomerMessage({ participantSid: "MB-customer", author: "Cliente" }, participants), true)
  assert.equal(isCustomerMessage({ participantSid: null, author: "+5511999999999" }, participants), true)
  assert.equal(isCustomerMessage({ participantSid: null, author: "whatsapp:+5511999999999" }, participants), true)
})

test("message alignment keeps agents, bots, system, proxy and unknown authors on the left", () => {
  for (const author of ["Bot", "Sistema", "", "whatsapp:+5511888888888", "+5511777777777"]) {
    assert.equal(isCustomerMessage({ participantSid: null, author }, participants), false)
  }
  assert.equal(isCustomerMessage({ participantSid: "MB-agent", author: "+5511999999999" }, participants), false)
  assert.equal(isCustomerMessage({ participantSid: null, author: "+5511999999999" }, []), false)
})

for (const [action, functionName] of [["fetch", "fetchConversation"], ["history", "fetchConversationHistory"]]) {
  function route(clientFactory, operation) {
    return load(`app/api/conversations/${action}/route.ts`, {
      "@/lib/twilio-client": { getTwilioClient: clientFactory },
      [`@/features/conversations/lib/${action}`]: { [functionName]: operation },
    }).POST
  }
  const request = body => new Request("http://localhost", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })

  test(`${action}: rejects malformed input before creating a client`, async () => {
    let calls = 0
    const POST = route(() => { calls++; throw new Error() })
    for (const body of [null, [], "text", {}, { sid: "CHbad" }, { sid, accountSid: 12 }, { sid, ...credentials, authToken: {} }, { sid, accountSid: credentials.accountSid }, { sid, ...credentials, authToken: "bad" }]) {
      assert.equal((await POST(request(body))).status, 400)
    }
    assert.equal((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status, 400)
    assert.equal(calls, 0)
  })

  test(`${action}: forwards a trimmed SID and credentials; supports server fallback`, async () => {
    const client = {}
    const args = []
    const POST = route((...values) => { args.push(values); return client }, async (value, receivedClient) => {
      assert.equal(value, sid)
      assert.equal(receivedClient, client)
      return { conversation: { sid } }
    })
    assert.equal((await POST(request({ sid: ` ${sid} `, ...credentials }))).status, 200)
    assert.equal((await POST(request({ sid }))).status, 200)
    assert.deepEqual(args, [[credentials.accountSid, credentials.authToken], [undefined, undefined]])
  })

  test(`${action}: credential and upstream failures are generic and do not leak`, async () => {
    const secretError = new Error(`upstream ${credentials.authToken}`)
    for (const POST of [route(() => { throw secretError }), route(() => ({}), async () => { throw secretError })]) {
      const response = await POST(request({ sid, ...credentials }))
      assert.equal(response.status, 500)
      const text = await response.text()
      assert.equal(text.includes(credentials.authToken), false)
      assert.equal(text.includes("upstream"), false)
      assert.equal(text.includes("stack"), false)
    }
  })
}
