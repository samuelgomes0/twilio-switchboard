import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"
import { clientHarness } from "./sse-client-harness.mjs"
import { componentHarness } from "./component-harness.mjs"

const sid = (prefix, digit = "1") => prefix + digit.repeat(32)
const credentials = { accountSid: sid("AC"), authToken: "2".repeat(32) }
const review = (targets) => ({ generatedAt: Date.now(), targets, partial: false })
const events = text => text.trim().split("\n\n").map(frame => JSON.parse(frame.slice(5)))
const request = body => new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ ...credentials, ...body }) })
const closeFields = { participants: ["11999999999"] }

function closeFixture(items, fetchState = "active") {
  const writes = []
  const client = { conversations: { v1: { participantConversations: { list: async () => items }, conversations: id => ({ fetch: async () => ({ state: fetchState }), update: async () => { writes.push(id) } }) } } }
  const load = createLoader({ "@/lib/twilio-client": { getTwilioClient: () => client } })
  return { client, writes, load, POST: load("app/api/conversations/close-by-number/route.ts").POST }
}


test("review validates freshness, uniqueness, resource formats, size before client creation", async () => {
  const { isOperationReview, REVIEW_MAX_AGE } = createLoader()("lib/operation-review.ts")
  const valid = review([{ id: sid("CH"), relatedId: null }])
  assert.equal(isOperationReview(valid, "CH"), true)
  for (const invalid of [null, [], {}, { ...valid, generatedAt: NaN }, { ...valid, generatedAt: Date.now() - REVIEW_MAX_AGE - 1 }, { ...valid, generatedAt: Date.now() + 40_000 }, { ...valid, targets: [valid.targets[0], valid.targets[0]] }, { ...valid, targets: [{ id: "bad", relatedId: null }] }, { ...valid, targets: Array(1001).fill(valid.targets[0]) }]) assert.equal(isOperationReview(invalid, "CH"), false)
  let calls = 0
  const load = createLoader({ "@/lib/twilio-client": { getTwilioClient() { calls++; throw new Error() } } })
  for (const [path, fields] of [["conversations/close-by-number", closeFields],]) {
    const { POST } = load(`app/api/${path}/route.ts`)
    for (const extra of [{ previewOnly: "true" }, { review: null }, { review: valid, previewOnly: true }]) assert.equal((await POST(request({ ...fields, ...extra }))).status, 400)
  }
  assert.equal(calls, 0)
})

test("close preview is read only, deduplicates active SIDs and reports truncation", async () => {
  const items = [{ conversationSid: sid("CH"), conversationState: "active" }, ...Array.from({ length: 1000 }, () => ({ conversationSid: sid("CH", "2"), conversationState: "closed" }))]
  const f = closeFixture(items)
  const response = await f.POST(request({ participants: ["11999999999", "11888888888"], previewOnly: true }))
  const data = await response.json()
  assert.equal(data.partial, true)
  assert.deepEqual(data.targets, [{ id: sid("CH"), relatedId: null }])
  assert.deepEqual(f.writes, [])
})

test("reviewed close never expands targets and rechecks the fresh active state", async () => {
  const items = ["1", "2"].map(digit => ({ conversationSid: sid("CH", digit), conversationState: "active" }))
  const f = closeFixture(items)
  const response = await f.POST(request({ ...closeFields, review: review([{ id: sid("CH"), relatedId: null }]) }))
  const log = events(await response.text())
  assert.deepEqual(f.writes, [sid("CH")])
  assert.equal(log.find(item => item.result)?.result.status, "success")
  const changed = closeFixture(items, "closed")
  const changedEvents = events(await (await changed.POST(request({ ...closeFields, review: review([{ id: sid("CH"), relatedId: null }]) }))).text())
  assert.deepEqual(changed.writes, [])
  assert.equal(changedEvents.find(item => item.result)?.result.status, "skipped")
})

test("reviewed close refuses unrelated targets and aborts before a write", async () => {
  const f = closeFixture([])
  await f.POST(request({ ...closeFields, review: review([{ id: sid("CH"), relatedId: null }]) })).then(response => response.text())
  assert.deepEqual(f.writes, [])
  const controller = new AbortController(); controller.abort()
  await assert.rejects(f.load("features/conversations/lib/close.ts").closeConversations(closeFields.participants, f.client, () => {}, controller.signal, review([])), { name: "AbortError" })
})

test("preview failures sanitize upstream data and never return credentials", async () => {
  const f = closeFixture([])
  f.client.conversations.v1.participantConversations.list = async () => { throw new Error("secret-token") }
  const response = await f.POST(request({ ...closeFields, previewOnly: true }))
  assert.equal(response.status, 500)
  assert.equal((await response.text()).includes("secret-token"), false)
})

test("review form invalidates a pending preview on edits and never dispatches an automatic write", async t => {
  let resolveResponse
  let phones = ["11999999999"]
  const previous = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => { calls.push(JSON.parse(init.body)); return new Promise(resolve => { resolveResponse = resolve }) }
  t.after(() => { globalThis.fetch = previous })
  const h = componentHarness("features/conversations/components/close-form.tsx", "CloseForm", {
    "@/features/environments/context": { useEnvironment: () => ({ activeEnvironment: { id: "env", ...credentials } }) },
    "@/components/use-operation-draft": { useUnsavedChanges() {}, useOperationDraft: () => [phones, value => { phones = typeof value === "function" ? value(phones) : value }] },
    "@/components/use-browser-state": { useBrowserState: () => [[], () => {}] },
  })
  const action = name => h.find(node => node.props?.action === name, h.find(node => node.props?.actions).props.actions)
  h.render(); h.flushEffects()
  assert.equal(action("destructive").props.disabled, true)
  const analyzing = action("search").props.onClick()
  h.find(node => node.props?.id === "close-phone-0").props.onChange("11888888888")
  h.render(); h.flushEffects()
  resolveResponse({ ok: true, json: async () => review([{ id: sid("CH"), relatedId: null }]) })
  await analyzing
  await new Promise(resolve => setImmediate(resolve))
  h.render()
  assert.equal(action("destructive").props.disabled, true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].previewOnly, true)
  h.dispose()
})

test("drafts remain in tab memory and restore the correct environment without triggering requests", async t => {
  const previousRaf = globalThis.requestAnimationFrame
  const previousCancel = globalThis.cancelAnimationFrame
  globalThis.requestAnimationFrame = callback => setImmediate(callback)
  globalThis.cancelAnimationFrame = clearImmediate
  t.after(() => { globalThis.requestAnimationFrame = previousRaf; globalThis.cancelAnimationFrame = previousCancel })
  let environmentId = "first"
  const h = componentHarness("features/conversations/components/close-form.tsx", "CloseForm", {
    "@/features/environments/context": { useEnvironment: () => ({ activeEnvironment: { id: environmentId, ...credentials } }) },
    "@/components/use-browser-state": { useBrowserState: () => [[], () => {}] },
  })
  async function render() { h.render(); h.flushEffects(); await new Promise(resolve => setImmediate(resolve)); return h.render() }
  await render()
  h.find(node => node.props?.id === "close-phone-0").props.onChange("11999999999")
  await render()
  environmentId = "second"; await render()
  assert.equal(h.find(node => node.props?.id === "close-phone-0").props.value, "")
  h.find(node => node.props?.id === "close-phone-0").props.onChange("11888888888")
  environmentId = "first"; await render()
  assert.equal(h.find(node => node.props?.id === "close-phone-0").props.value, "11999999999")
  h.dispose()
})

test("unsaved protection shares one listener and preserves the page when leaving is declined", t => {
  const previous = globalThis.window
  const previousDocument = globalThis.document
  const listeners = new Map()
  globalThis.window = { addEventListener: (name, handler) => listeners.set(name, handler), removeEventListener: name => listeners.delete(name), confirm: () => false }
  globalThis.document = { addEventListener() {}, removeEventListener() {} }
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument })
  const { registerUnsavedChanges, confirmDiscardChanges } = createLoader()("lib/unsaved-changes.ts")
  assert.equal(confirmDiscardChanges(), true)
  const first = registerUnsavedChanges(); const second = registerUnsavedChanges()
  assert.equal(listeners.size, 1)
  assert.equal(confirmDiscardChanges(), false)
  let prevented = false
  listeners.get("beforeunload")({ preventDefault() { prevented = true } })
  assert.equal(prevented, true)
  first(); assert.equal(confirmDiscardChanges(), false)
  second(); assert.equal(listeners.size, 0); assert.equal(confirmDiscardChanges(), true)
})

test("a confirmed target survives EOF failure without completion or history", async () => {
  const confirmed = { level: "success", message: "Concluído", result: { id: sid("CH"), status: "success" } }
  const h = clientHarness("close", { chunks: [`data: ${JSON.stringify(confirmed)}\n\n`] })
  await h.run()
  assert.equal(h.state.status, "error")
  assert.deepEqual(h.state.results, [confirmed.result])
  assert.deepEqual(h.state.history, [])
})
