import assert from "node:assert/strict"
import test from "node:test"
import { clients, clientHarness } from "./sse-client-harness.mjs"

const frame = payload => `data: ${JSON.stringify(payload)}\n\n`
const final = { level: "success", message: "fim", done: true, workflowSid: "WW", totalAdded: 1, totalErrors: 0 }

for (const [name] of clients) {
  const strict = name === "update-worker-feature"
  async function run(options) {
    const result = clientHarness(name, options)
    await result.run({})
    assert.equal(result.abortRef.current, null)
    assert.equal(result.trace.filter(([type]) => type === "cancel").length, 0)
    const acquired = result.trace.some(([type]) => type === "reader")
    assert.equal(result.trace.filter(([type]) => type === "release").length, strict && acquired ? 1 : 0)
    return result
  }

  test(`${name}: buffers fragmented UTF-8, multiple frames and ordered callbacks`, async () => {
    const text = frame({ level: "info", message: "ação 😀", progress: { current: 1, total: 2 } }) + frame(final)
    const bytes = new TextEncoder().encode(text)
    const whole = await run({ chunks: [bytes] })
    const fragmented = await run({ chunks: Array.from(bytes, byte => Uint8Array.of(byte)) })
    assert.deepEqual(fragmented.state, whole.state)
    assert.deepEqual(whole.state.logs.map(log => log.message), ["ação 😀", "fim"])
    assert.equal(whole.state.status, "done")
    assert.equal(whole.state.history.length, strict ? 0 : 1)
    assert.deepEqual(fragmented.trace.filter(([type]) => type !== "read"), whole.trace.filter(([type]) => type !== "read"))
  })

  test(`${name}: drops incomplete tail, ignores empty/non-data frames and uses first data line`, async () => {
    const first = { level: "info", message: "first" }
    const chunks = ["\n\nevent: ping\n\n" + `id: 1\ndata: ${JSON.stringify(first)}\ndata: {broken\n\n` + frame(final) + 'data: {"message":"tail"}']
    const result = await run({ chunks })
    assert.deepEqual(result.state.logs.map(log => log.message), ["first", "fim"])
    assert.equal(result.state.status, "done")
    for (const tail of [frame(final).slice(0, -2), frame(final).slice(0, -1), frame(final).replaceAll("\n", "\r\n"), ""]) {
      const missing = await run({ chunks: [tail] })
      assert.equal(missing.state.status, strict ? "error" : "done")
      assert.equal(missing.state.history.length, 0)
    }
  })

  test(`${name}: retains malformed JSON, invalid payload and callback failure policies`, async () => {
    for (const raw of ["{broken", "null", '{"level":"other","message":5}']) {
      const result = await run({ chunks: [`data: ${raw}\n\n` + frame(final)] })
      assert.equal(result.state.status, strict ? "error" : "done")
      assert.equal(result.state.logs.some(log => log.message === "fim"), !strict)
    }
    const failed = await run({ chunks: [frame({ level: "info", message: "fail" }) + frame(final)], throwLog: "fail" })
    assert.equal(failed.state.status, strict ? "error" : "done")
  })

  test(`${name}: final events do not stop reads; duplicate finals keep side effects`, async () => {
    const result = await run({ chunks: [frame(final), frame({ ...final, message: "again" })] })
    assert.deepEqual(result.state.logs.map(log => log.message), ["fim", "again"])
    assert.equal(result.state.history.length, strict ? 0 : 2)
    assert.equal(result.trace.filter(([type]) => type === "read").length, 3)
    const error = await run({ chunks: [frame({ level: "error", message: "erro", done: true, totalErrors: 1 })] })
    assert.equal(error.state.status, strict || name === "add-particular-filter" ? "error" : "done")
    if (name === "create-workflow") assert.deepEqual(error.trace.filter(([type]) => type === "status").map(([, value]) => value), ["running", "error", "done"])
    const truthy = await run({ chunks: [frame({ ...final, done: "yes" })] })
    assert.equal(truthy.state.status, strict ? "error" : "done")
  })

  test(`${name}: read/network/HTTP failures and AbortError remain distinct`, async () => {
    for (const options of [
      { chunks: [new Error("network")] },
      { chunks: [frame(final), new Error("network")] },
      { fetchError: new Error("network") },
      { ok: false, httpBody: '{"error":"http failure"}' },
      { noBody: true, httpBody: "invalid" },
    ]) {
      const result = await run(options)
      assert.equal(result.state.status, "error")
      if (options.ok === false) {
        assert.equal(result.trace.some(([type]) => type === "reader"), false)
        assert.equal(result.state.logs.at(-1).message === "http failure", !strict)
      }
    }
    const abortError = new Error("abort")
    abortError.name = "AbortError"
    const unSignalled = await run({ chunks: [abortError] })
    assert.equal(unSignalled.state.status, strict ? "error" : "idle")
    const aborted = await run({ onRead: ({ abortRef }) => { abortRef.current.abort(); throw abortError } })
    assert.equal(aborted.state.status, "idle")
    assert.equal(aborted.state.logs.at(-1).level, "warning")
    const otherAbort = await run({ onRead: ({ abortRef }) => { abortRef.current.abort(); throw new Error("other") } })
    assert.equal(otherAbort.state.status, strict ? "idle" : "error")
  })
}
