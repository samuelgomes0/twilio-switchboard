import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const workspaceSid = `WS${"1".repeat(32)}`
const credentials = {
  accountSid: `AC${"2".repeat(32)}`,
  authToken: "3".repeat(32),
}

function request(body) {
  return new Request("http://localhost/api/taskrouter/workflows/preview-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

test("CSV analysis classifies valid, duplicate, incomplete, excluded, and unsafe rows", () => {
  const { analyzeWorkflowCsv } = createLoader()(
    "features/taskrouter/lib/create-workflow.ts"
  )
  const analysis = analyzeWorkflowCsv(
    [
      "Regra de Negócio;Fila Twilio",
      "Suporte;Fila A",
      "Suporte;Fila A",
      ";Fila B",
      "-;-",
      "Regra 'inválida';Fila A",
    ].join("\n")
  )

  assert.deepEqual(
    analysis.diagnostics.map(({ lineNumber, status, reason }) => ({
      lineNumber,
      status,
      reason,
    })),
    [
      { lineNumber: 2, status: "valid", reason: "ready" },
      { lineNumber: 3, status: "ignored", reason: "duplicate-row" },
      { lineNumber: 4, status: "ignored", reason: "incomplete-row" },
      { lineNumber: 5, status: "ignored", reason: "excluded-row" },
      { lineNumber: 6, status: "error", reason: "invalid-rule" },
    ]
  )
  assert.deepEqual(analysis.rows, [{ regra: "Suporte", fila: "Fila A" }])
})

test("CSV analysis retains the physical start line of quoted multiline rows", () => {
  const { analyzeWorkflowCsv } = createLoader()(
    "features/taskrouter/lib/create-workflow.ts"
  )
  const analysis = analyzeWorkflowCsv(
    'Regra de Negócio;Fila Twilio\r\n"Regra\r\nmultilinha";Fila A\r\nOutra;Fila B'
  )

  assert.deepEqual(
    analysis.diagnostics.map(({ lineNumber }) => lineNumber),
    [2, 4]
  )
})

test("CSV preview resolves queues and blocks creation when any row has an error", async () => {
  let queueReads = 0
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({
          taskQueues: {
            list: async () => {
              queueReads++
              return [
                { friendlyName: "Fila A", sid: "WQ-a" },
                { friendlyName: "EVERYONE", sid: "WQ-default" },
              ]
            },
          },
        }),
      },
    },
  }
  const { previewWorkflowCsv } = createLoader()(
    "features/taskrouter/lib/create-workflow.ts"
  )
  const preview = await previewWorkflowCsv(
    {
      workspaceSid,
      csvContent:
        "Regra de Negócio;Fila Twilio\nSuporte;Fila A\nFinanceiro;Fila ausente\nSuporte;Fila A",
    },
    client
  )

  assert.equal(queueReads, 1)
  assert.equal(preview.validRows, 1)
  assert.equal(preview.ignoredRows, 1)
  assert.equal(preview.errorRows, 1)
  assert.equal(preview.defaultQueueFound, true)
  assert.equal(preview.canCreate, false)
  assert.equal(preview.diagnostics[0].queueSid, "WQ-a")
  assert.equal(preview.diagnostics[1].reason, "queue-not-found")
})

test("CSV preview avoids Twilio reads when no row can be resolved", async () => {
  let queueReads = 0
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({
          taskQueues: {
            list: async () => {
              queueReads++
              return []
            },
          },
        }),
      },
    },
  }
  const { previewWorkflowCsv } = createLoader()(
    "features/taskrouter/lib/create-workflow.ts"
  )
  const preview = await previewWorkflowCsv(
    {
      workspaceSid,
      csvContent: "Regra de Negócio;Fila Twilio\n-;-\n;Fila A",
    },
    client
  )

  assert.equal(queueReads, 0)
  assert.equal(preview.validRows, 0)
  assert.equal(preview.ignoredRows, 2)
  assert.equal(preview.errorRows, 0)
  assert.equal(preview.defaultQueueFound, null)
  assert.equal(preview.canCreate, false)
})

test("workflow creation still revalidates queues and performs no partial write", async () => {
  let writes = 0
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({
          taskQueues: {
            list: async () => [
              { friendlyName: "Outra fila", sid: "WQ-other" },
            ],
          },
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
  const { createWorkflow } = createLoader()(
    "features/taskrouter/lib/create-workflow.ts"
  )

  await assert.rejects(
    createWorkflow(
      {
        workspaceSid,
        workflowName: "Atendimento",
        csvContent: "Regra de Negócio;Fila Twilio\nSuporte;Fila ausente",
      },
      client,
      () => {}
    ),
    /Fila não encontrada/
  )
  assert.equal(writes, 0)
})

test("CSV preview route rejects invalid input before creating a client", async () => {
  let clientCalls = 0
  const { POST } = createLoader({
    "@/lib/twilio-client": {
      getTwilioClient: () => {
        clientCalls++
        return {}
      },
    },
    "@/features/taskrouter/lib/create-workflow": {
      previewWorkflowCsv: async () => ({}),
    },
  })("app/api/taskrouter/workflows/preview-import/route.ts")

  for (const body of [
    null,
    [],
    {},
    { workspaceSid: "WSbad", csvContent: "csv", ...credentials },
    { workspaceSid, csvContent: "", ...credentials },
    { workspaceSid, csvContent: "x".repeat(1_000_001), ...credentials },
    { workspaceSid, csvContent: "csv", accountSid: "ACbad", authToken: credentials.authToken },
  ]) {
    assert.equal((await POST(request(body))).status, 400)
  }
  assert.equal(clientCalls, 0)
})

test("CSV preview route forwards trimmed input and sanitizes upstream failures", async () => {
  const client = {}
  const calls = []
  const expected = {
    diagnostics: [],
    totalRows: 0,
    validRows: 0,
    ignoredRows: 0,
    errorRows: 0,
    defaultQueueFound: null,
    canCreate: false,
  }
  const success = createLoader({
    "@/lib/twilio-client": {
      getTwilioClient: (...args) => {
        calls.push(["credentials", ...args])
        return client
      },
    },
    "@/features/taskrouter/lib/create-workflow": {
      previewWorkflowCsv: async (...args) => {
        calls.push(["operation", ...args])
        return expected
      },
    },
  })("app/api/taskrouter/workflows/preview-import/route.ts").POST
  const response = await success(
    request({
      workspaceSid: ` ${workspaceSid} `,
      csvContent: " csv ",
      ...credentials,
    })
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), expected)
  assert.deepEqual(calls, [
    ["credentials", credentials.accountSid, credentials.authToken],
    ["operation", { workspaceSid, csvContent: " csv " }, client],
  ])

  const secret = `upstream ${credentials.authToken}`
  const failure = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => ({}) },
    "@/features/taskrouter/lib/create-workflow": {
      previewWorkflowCsv: async () => {
        throw new Error(secret)
      },
    },
  })("app/api/taskrouter/workflows/preview-import/route.ts").POST
  const failedResponse = await failure(
    request({ workspaceSid, csvContent: "csv", ...credentials })
  )
  assert.equal(failedResponse.status, 500)
  assert.equal((await failedResponse.text()).includes(secret), false)
})
