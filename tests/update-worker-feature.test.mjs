import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import test from "node:test"
import ts from "typescript"

const require = createRequire(import.meta.url)
function load(relative, overrides = {}) {
  const filename = path.resolve(relative)
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
  const exports = {}
  const localRequire = (id) => {
    if (id in overrides) return overrides[id]
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`, overrides)
    return require(id)
  }
  new Function("require", "exports", source)(localRequire, exports)
  return exports
}

const sse = {
  sseEvent: (level, message, data = {}) =>
    `data: ${JSON.stringify({ level, message, ...data })}\n\n`,
}
const overrides = { "@/features/conversations/lib/close": sse }
const { mergeWorkerFeature, updateWorkerFeature } = load(
  "features/taskrouter/lib/update-worker-feature.ts",
  overrides
)
const workspaceSid = `WS${"0".repeat(32)}`
const workerSids = [1, 2, 3].map((value) => `WK${String(value).repeat(32)}`)
const input = {
  workspaceSid,
  workerSids,
  feature: "dasa_cdc_integration",
  enabled: true,
}

test("preserves unrelated attributes and feature properties, including enabled=false", () => {
  const attributes = {
    routing: { skills: ["SUPORTE"], levels: { SUPORTE: 1 } },
    roles: ["admin"],
    config_overrides: {
      other: 1,
      features: {
        existing: { enabled: true },
        dasa_cdc_integration: { enabled: true, extra: 42 },
      },
    },
  }
  const expected = structuredClone(attributes)
  expected.config_overrides.features.dasa_cdc_integration.enabled = false
  assert.deepEqual(
    JSON.parse(
      mergeWorkerFeature(JSON.stringify(attributes), input.feature, false)
    ),
    expected
  )
})

test("creates missing containers and rejects malformed attributes without replacing them", () => {
  for (const raw of [
    "{}",
    '{"config_overrides":{}}',
    '{"config_overrides":{"features":{}}}',
  ]) {
    assert.deepEqual(
      JSON.parse(mergeWorkerFeature(raw, input.feature, true)).config_overrides
        .features,
      { dasa_cdc_integration: { enabled: true } }
    )
  }
  for (const raw of [
    "invalid",
    "null",
    "[]",
    '{"config_overrides":null}',
    '{"config_overrides":{"features":[]}}',
    '{"config_overrides":{"features":{"dasa_cdc_integration":false}}}',
  ]) {
    assert.throws(() => mergeWorkerFeature(raw, input.feature, true))
  }
})

function mockClient(fetchWorker, update) {
  return {
    taskrouter: {
      v1: {
        workspaces: () => ({
          workers: (sid) => ({
            fetch: () => fetchWorker(sid),
            update: (body) => update(sid, body),
          }),
        }),
      },
    },
  }
}

test("batch is sequential and continues after a worker failure with generic errors", async () => {
  const calls = []
  const events = []
  const client = mockClient(
    async (sid) => {
      calls.push(`fetch:${sid}`)
      if (sid === workerSids[1]) throw new Error("SECRET")
      return { attributes: "{}" }
    },
    async (sid) => {
      calls.push(`update:${sid}`)
    }
  )
  assert.deepEqual(
    await updateWorkerFeature(
      input,
      client,
      (event) => events.push(event),
      new AbortController().signal
    ),
    { totalUpdated: 2, totalErrors: 1 }
  )
  assert.deepEqual(calls, [
    `fetch:${workerSids[0]}`,
    `update:${workerSids[0]}`,
    `fetch:${workerSids[1]}`,
    `fetch:${workerSids[2]}`,
    `update:${workerSids[2]}`,
  ])
  assert.ok(!events.join("").includes("SECRET"))
})

test("resolves an email before updating the Worker feature", async () => {
  const calls = []
  const workers = (sid) => ({
    fetch: async () => ({ sid, attributes: "{}" }),
    update: async () => calls.push(`update:${sid}`),
  })
  workers.list = async ({ friendlyName }) => {
    calls.push(`list:${friendlyName}`)
    return [{ sid: workerSids[0], attributes: "{}" }]
  }
  const client = {
    taskrouter: { v1: { workspaces: () => ({ workers }) } },
  }

  const result = await updateWorkerFeature(
    { ...input, workerSids: ["agente@empresa.com"] },
    client,
    () => {},
    new AbortController().signal
  )

  assert.deepEqual(result, { totalUpdated: 1, totalErrors: 0 })
  assert.deepEqual(calls, [
    "list:agente@empresa.com",
    `update:${workerSids[0]}`,
  ])
})

test("cancellation after fetch prevents writes; cancellation after update stops remaining workers", async () => {
  for (const cancelAt of ["fetch", "update"]) {
    const abort = new AbortController()
    let fetched = 0
    let updated = 0
    const client = mockClient(
      async () => {
        fetched++
        if (cancelAt === "fetch") abort.abort()
        return { attributes: "{}" }
      },
      async () => {
        updated++
        abort.abort()
      }
    )
    await updateWorkerFeature(input, client, () => {}, abort.signal)
    assert.equal(fetched, 1)
    assert.equal(updated, cancelAt === "fetch" ? 0 : 1)
  }
})

test("route rejects invalid bodies before creating a client", async () => {
  let created = 0
  const { POST } = load("app/api/taskrouter/update-worker-feature/route.ts", {
    ...overrides,
    "@/lib/twilio-client": {
      getTwilioClient: () => {
        created++
        throw new Error()
      },
    },
  })
  for (const body of [
    null,
    [],
    {},
    { ...input, enabled: "false" },
    { ...input, workerSids: [1] },
    { ...input, workerSids: Array(11).fill(workerSids[0]) },
    { ...input, feature: "__proto__" },
    { ...input, workspaceSid: "bad" },
    { ...input, accountSid: 1 },
    { ...input, authToken: {} },
  ]) {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify(body),
      })
    )
    assert.equal(response.status, 400)
  }
  assert.equal(created, 0)
})

test("route streams completion, deduplicates workers, and accepts false", async () => {
  let updated = 0
  const client = mockClient(
    async () => ({ attributes: "{}" }),
    async (_sid, body) => {
      updated++
      assert.equal(
        JSON.parse(body.attributes).config_overrides.features
          .dasa_cdc_integration.enabled,
        false
      )
    }
  )
  const { POST } = load("app/api/taskrouter/update-worker-feature/route.ts", {
    ...overrides,
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })
  const response = await POST(
    new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        workerSids: [workerSids[0], workerSids[0]],
        enabled: false,
      }),
    })
  )
  assert.equal(response.headers.get("Content-Type"), "text/event-stream")
  assert.equal(response.headers.get("X-Accel-Buffering"), "no")
  const events = (await response.text())
    .trim()
    .split("\n\n")
    .map((event) => JSON.parse(event.slice(6)))
  assert.equal(updated, 1)
  assert.equal(events.at(-1).done, true)
  assert.equal(events.at(-1).totalUpdated, 1)
})
