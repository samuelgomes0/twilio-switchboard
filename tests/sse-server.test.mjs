import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const credentials = {
  accountSid: `AC${"1".repeat(32)}`,
  authToken: "2".repeat(32),
}
const workspaceSid = `WS${"3".repeat(32)}`
const workflowSid = `WW${"4".repeat(32)}`
const taskQueueSid = `WQ${"5".repeat(32)}`

const flows = [
  ["conversations/close", "closeConversations", { participants: ["11999999999"] }, { totalClosed: 2, totalErrors: 0 }],
  ["taskrouter/assign-workers", "assignWorkersToQueue", { workspaceSid, skill: "skill", emails: ["worker"] }, { totalUpdated: 2, totalSkipped: 1, totalErrors: 0 }],
  ["taskrouter/cancel-queue-tasks", "cancelQueueTasks", { workspaceSid, taskQueueName: "queue" }, { totalSuccess: 2, totalSkipped: 1, totalErrors: 0 }],
  ["taskrouter/create-workflow", "createWorkflow", { workspaceSid, workflowName: "workflow", csvContent: "csv" }, { workflowSid, workflowName: "workflow", totalFilters: 2 }],
  ["taskrouter/add-particular-filter", "addParticularFilter", { workspaceSid, filterName: "filter", entries: [{ workflowSid, taskQueueSid }] }, { totalAdded: 2, totalSkipped: 1, totalErrors: 0 }],
  ["taskrouter/update-worker-feature", "updateWorkerFeature", { workspaceSid: `WS${"0".repeat(32)}`, workerSids: [`WK${"0".repeat(32)}`], feature: "feature", enabled: false }, { totalUpdated: 2, totalErrors: 0 }],
]

for (const [endpoint, operationName, input, result] of flows) {
  const strict = endpoint.endsWith("update-worker-feature")
  const catches = strict || endpoint.endsWith("create-workflow") || endpoint.endsWith("add-particular-filter")
  const [domain, action] = endpoint.split("/")
  function route(operation) {
    const load = createLoader()
    const original = load("features/conversations/lib/close.ts")
    return createLoader({
      "@/lib/twilio-client": { getTwilioClient: () => ({}) },
      [`@/features/${domain}/lib/${action}`]: { ...original, [operationName]: operation },
    })(`app/api/${endpoint}/route.ts`).POST
  }
  const request = signal => ({ json: async () => ({ ...input, ...credentials }), signal })

  test(`${endpoint}: preserves headers, UTF-8 event bytes, completion fields and closing`, async () => {
    const event = 'data: {"level":"info","message":"ação 😀"}\n\n'
    const POST = route(async (...args) => { args[2](event); return result })
    const response = await POST(request(new AbortController().signal))
    assert.deepEqual(Object.fromEntries(response.headers), {
      "cache-control": "no-cache", "connection": "keep-alive",
      "content-type": "text/event-stream", "x-accel-buffering": "no",
    })
    const text = await response.text()
    assert.ok(text.includes(event))
    assert.ok(text.endsWith("\n\n"))
    const events = text.trim().split("\n\n").map(line => JSON.parse(line.slice(5)))
    const last = events.at(-1)
    assert.equal(last.done, true)
    for (const [key, value] of Object.entries(result)) assert.equal(last[key], value)
    assert.equal(last.level, strict || catches ? "success" : "info")
    assert.equal(events.length, action === "close" || action === "assign-workers" ? 3 : 2)
  })

  test(`${endpoint}: unexpected operation errors preserve stream-error versus final-event behavior`, async () => {
    const response = await route(async () => { throw new Error("private failure") })(request(new AbortController().signal))
    if (!catches) await assert.rejects(response.text(), /private failure/)
    else {
      const text = await response.text()
      assert.equal(text.includes("private failure"), false)
      const last = JSON.parse(text.trim().split("\n\n").at(-1).slice(5))
      assert.equal(last.done, true)
      assert.equal(last.level, "error")
    }
  })

  test(`${endpoint}: request abort and response cancellation retain signal propagation`, async () => {
    for (const mode of ["request", "response", "preaborted"]) {
      const controller = new AbortController()
      if (mode === "preaborted") controller.abort()
      let receivedSignal
      let finish
      const gate = new Promise(resolve => { finish = resolve })
      const response = await route(async (...args) => {
        receivedSignal = args[3]
        await gate
        return result
      })(request(controller.signal))
      const reader = response.body.getReader()
      if (mode === "request") controller.abort()
      if (mode === "response") await reader.cancel()
      assert.equal(receivedSignal?.aborted, strict ? true : undefined)
      finish()
      // An aborted Worker Feature request suppresses both emissions and close.
      if (strict && mode !== "response") await reader.cancel()
      else if (mode !== "response") while (!(await reader.read()).done) { /* drain */ }
      reader.releaseLock()
    }
  })
}

test("SSE serialization retains JSON escaping, field overwrite order and exceptions", () => {
  const { sseEvent } = createLoader()("features/conversations/lib/close.ts")
  assert.equal(sseEvent("info", "ação\n😀"), 'data: {"level":"info","message":"ação\\n😀"}\n\n')
  assert.equal(sseEvent("info", "old", { level: "warning", message: "new", done: true }), 'data: {"level":"warning","message":"new","done":true}\n\n')
  assert.throws(() => sseEvent("info", "message", { value: 1n }), TypeError)
})
