import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import test from "node:test"
import ts from "typescript"

const require = createRequire(import.meta.url)

function createLoader(overrides = {}) {
  const cache = new Map()
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative)
    const source = ts.transpileModule(
      readFileSync(path.resolve(relative), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }
    ).outputText
    const exports = {}
    cache.set(relative, exports)
    const localRequire = (id) => {
      if (id in overrides) return overrides[id]
      if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`)
      return require(id)
    }
    new Function("require", "exports", source)(localRequire, exports)
    return exports
  }
  return load
}

const privateDetail = "upstream-private-detail"
const request = (body) =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
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

for (const [action, operation, body] of [
  [
    "create-workflow",
    "createWorkflow",
    {
      workspaceSid: "WS-test",
      workflowName: "Teste",
      csvContent: "header\nrow",
    },
  ],
  [
    "add-particular-filter",
    "addParticularFilter",
    {
      workspaceSid: "WS-test",
      filterName: "Teste",
      entries: [{ workflowSid: "WW-test", taskQueueSid: "WQ-test" }],
    },
  ],
]) {
  test(`${action}: unexpected failures end SSE without leaking details`, async () => {
    for (const failure of [null, new Error(privateDetail)]) {
      const load = createLoader({
        "@/lib/twilio-client": { getTwilioClient: () => ({}) },
        [`@/features/taskrouter/lib/${action}`]: {
          [operation]: async () => {
            throw failure
          },
        },
      })
      const { POST } = load(`app/api/taskrouter/${action}/route.ts`)
      const response = await POST(request(body))
      assert.equal(response.headers.get("Content-Type"), "text/event-stream")
      const text = await response.text()
      assert.equal(text.includes(privateDetail), false)
      assert.equal(eventsFrom(text).at(-1).done, true)
      assert.equal(eventsFrom(text).at(-1).level, "error")
    }
  })
}

test("workflow CSV validation keeps its actionable message and performs no write", async () => {
  let writes = 0
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({
          taskQueues: { list: async () => [] },
          workflows: {
            create: async () => {
              writes++
              return {}
            },
          },
        }),
      },
    },
  }
  const load = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })
  const { POST } = load("app/api/taskrouter/create-workflow/route.ts")
  const { strings } = load("lib/strings.ts")
  const response = await POST(
    request({
      workspaceSid: "WS-test",
      workflowName: "Teste",
      csvContent: "invalid\nrow",
    })
  )
  const events = eventsFrom(await response.text())
  assert.equal(
    events.at(-1).message,
    strings.taskrouter.createWorkflow.log.invalidColumns
  )
  assert.equal(events.at(-1).done, true)
  assert.equal(writes, 0)
})

test("filter update sanitizes upstream failures and continues the batch", async () => {
  const load = createLoader()
  const { addParticularFilter } = load(
    "features/taskrouter/lib/add-particular-filter.ts"
  )
  let reads = 0
  const events = []
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({
          workflows: () => ({
            fetch: async () => {
              reads++
              throw new Error(privateDetail)
            },
          }),
        }),
      },
    },
  }
  const result = await addParticularFilter(
    {
      workspaceSid: "WS-test",
      filterName: "Teste",
      entries: [1, 2].map((i) => ({
        workflowSid: `WW-${i}`,
        taskQueueSid: `WQ-${i}`,
      })),
    },
    client,
    (event) => events.push(event)
  )
  assert.equal(reads, 2)
  assert.equal(result.totalErrors, 2)
  assert.equal(events.join("").includes(privateDetail), false)
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

test("workflow success preserves routing configuration and completion counters", async () => {
  const writes = []
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({
          taskQueues: {
            list: async () => [{ friendlyName: "Suporte", sid: "WQ-test" }],
          },
          workflows: {
            create: async (body) => {
              writes.push(body)
              return { sid: "WW-test", friendlyName: body.friendlyName }
            },
          },
        }),
      },
    },
  }
  const load = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })
  const { POST } = load("app/api/taskrouter/create-workflow/route.ts")
  const response = await POST(
    request({
      workspaceSid: "WS-test",
      workflowName: "Teste",
      csvContent: "Regra de Negócio;Fila Twilio\nregra;Suporte",
    })
  )
  const events = eventsFrom(await response.text())
  assert.equal(writes.length, 1)
  const configuration = JSON.parse(writes[0].configuration)
  assert.equal(
    configuration.task_routing.filters[0].expression,
    "regraDeNegocio IN ['regra']"
  )
  assert.equal(
    configuration.task_routing.filters[0].targets[0].queue,
    "WQ-test"
  )
  assert.equal(events.at(-1).done, true)
  assert.equal(events.at(-1).totalFilters, 1)
  assert.equal(events.at(-1).workflowSid, "WW-test")
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
