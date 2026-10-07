import assert from "node:assert/strict"
import test from "node:test"
import { clients, clientHarness } from "./sse-client-harness.mjs"

const frame = payload => `data: ${JSON.stringify(payload)}\n\n`
const final = {
  level: "success",
  message: "fim",
  done: true,
  workflowSid: "WW",
  totalAdded: 1,
  totalErrors: 0,
}

for (const [name] of clients) {
  async function run(options) {
    const result = clientHarness(name, options)
    await result.run({})
    assert.equal(result.abortRef.current, null)
    const acquired = result.trace.some(([type]) => type === "reader")
    assert.equal(
      result.trace.filter(([type]) => type === "release").length,
      acquired ? 1 : 0
    )
    return result
  }

  test(`${name}: decodifica UTF-8 fragmentado e conclui somente com evento final`, async () => {
    const text =
      frame({
        level: "info",
        message: "ação 😀",
        progress: { current: 1, total: 2 },
      }) + frame(final)
    const bytes = new TextEncoder().encode(text)
    const whole = await run({ chunks: [bytes] })
    const fragmented = await run({
      chunks: Array.from(bytes, byte => Uint8Array.of(byte)),
    })
    assert.deepEqual(fragmented.state, whole.state)
    assert.deepEqual(whole.state.logs.map(log => log.message), ["ação 😀", "fim"])
    assert.equal(whole.state.status, "done")
    assert.equal(whole.state.history.length, name === "update-worker-feature" ? 0 : 1)
    assert.equal(whole.trace.filter(([type]) => type === "cancel").length, 1)
  })

  test(`${name}: EOF sem final e frames incompletos são erro de protocolo`, async () => {
    for (const chunks of [
      [frame(final).slice(0, -2)],
      [frame(final).slice(0, -1)],
      [""],
      [frame({ level: "info", message: "parcial" })],
    ]) {
      const result = await run({ chunks })
      assert.equal(result.state.status, "error")
      assert.equal(result.state.history.length, 0)
    }

    const crlf = await run({ chunks: [frame(final).replaceAll("\n", "\r\n")] })
    assert.equal(crlf.state.status, "done")
  })

  test(`${name}: JSON ou payload inválido interrompe o stream`, async () => {
    for (const raw of ["{broken", "null", '{"level":"other","message":5}']) {
      const result = await run({ chunks: [`data: ${raw}\n\n` + frame(final)] })
      assert.equal(result.state.status, "error")
      assert.equal(result.state.logs.some(log => log.message === "fim"), false)
    }
    const failed = await run({
      chunks: [frame({ level: "info", message: "fail" }) + frame(final)],
      throwLog: "fail",
    })
    assert.equal(failed.state.status, "error")
  })

  test(`${name}: o primeiro final encerra leitura e efeitos laterais`, async () => {
    const result = await run({
      chunks: [frame(final), frame({ ...final, message: "again" })],
    })
    assert.deepEqual(result.state.logs.map(log => log.message), ["fim"])
    assert.equal(result.state.history.length, name === "update-worker-feature" ? 0 : 1)
    assert.equal(result.trace.filter(([type]) => type === "read").length, 1)

    const error = await run({
      chunks: [frame({ level: "error", message: "erro", done: true, totalErrors: 1 })],
    })
    assert.equal(error.state.status, "error")

    const invalidDone = await run({ chunks: [frame({ ...final, done: "yes" })] })
    assert.equal(invalidDone.state.status, "error")
  })

  test(`${name}: falhas HTTP, de rede e cancelamento permanecem distintos`, async () => {
    for (const options of [
      { chunks: [new Error("network")] },
      { fetchError: new Error("network") },
      { ok: false, httpBody: '{"error":"http failure"}' },
      { noBody: true, httpBody: "invalid" },
    ]) {
      const result = await run(options)
      assert.equal(result.state.status, "error")
    }

    const abortError = new Error("abort")
    abortError.name = "AbortError"
    const aborted = await run({
      onRead: ({ abortRef }) => {
        abortRef.current.abort()
        throw abortError
      },
    })
    assert.equal(aborted.state.status, "idle")
    assert.equal(aborted.state.logs.at(-1).level, "warning")
  })
}
