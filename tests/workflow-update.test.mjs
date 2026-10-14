import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const workspaceSid = `WS${"1".repeat(32)}`
const workflowSid = `WW${"2".repeat(32)}`
const queueSid = `WQ${"3".repeat(32)}`
const missingQueueSid = `WQ${"4".repeat(32)}`
const credentials = {
  accountSid: `AC${"5".repeat(32)}`,
  authToken: "6".repeat(32),
}
const dateUpdated = "2026-10-14T12:00:00.000Z"

function configuration(overrides = {}) {
  return JSON.stringify({
    task_routing: {
      filters: [
        {
          filter_friendly_name: "Suporte",
          expression: "type == 'support'",
          targets: [{ queue: queueSid, priority: 10, ...overrides }],
        },
      ],
      default_filter: { queue: queueSid },
    },
    metadata: { owner: "operations" },
  })
}

function workflow(overrides = {}) {
  return {
    sid: workflowSid,
    workspaceSid,
    friendlyName: "Atendimento",
    assignmentCallbackUrl: "https://example.com/assign",
    fallbackAssignmentCallbackUrl: null,
    taskReservationTimeout: 120,
    configuration: configuration(),
    dateCreated: new Date("2026-10-10T10:00:00Z"),
    dateUpdated,
    ...overrides,
  }
}

function input(overrides = {}) {
  return {
    workspaceSid,
    workflowSid,
    friendlyName: "Atendimento atualizado",
    assignmentCallbackUrl: "https://example.com/assign",
    fallbackAssignmentCallbackUrl: null,
    taskReservationTimeout: 120,
    configuration: configuration(),
    reEvaluateTasks: false,
    expectedDateUpdated: dateUpdated,
    ...overrides,
  }
}

function createClient({
  current = workflow(),
  update,
  fetchQueue,
} = {}) {
  const workflowResource = {
    fetch: async () => current,
    update:
      update ??
      (async (changes) =>
        workflow({
          ...changes,
          assignmentCallbackUrl:
            changes.assignmentCallbackUrl === ""
              ? null
              : (changes.assignmentCallbackUrl ??
                current.assignmentCallbackUrl),
          fallbackAssignmentCallbackUrl:
            changes.fallbackAssignmentCallbackUrl === ""
              ? null
              : (changes.fallbackAssignmentCallbackUrl ??
                current.fallbackAssignmentCallbackUrl),
          configuration: changes.configuration ?? current.configuration,
          dateUpdated: "2026-10-14T13:00:00.000Z",
        })),
  }
  const workflows = () => workflowResource
  const taskQueues = (sid) => ({
    fetch: async () =>
      fetchQueue ? fetchQueue(sid) : { sid, friendlyName: "Fila" },
  })
  return {
    taskrouter: {
      v1: {
        workspaces: () => ({ workflows, taskQueues }),
      },
    },
  }
}

function request(body) {
  return new Request("http://localhost/api/taskrouter/workflows/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

test("workflow update input normalizes supported fields and rejects unsafe values", () => {
  const { parseUpdateWorkflowInput } = createLoader()(
    "features/taskrouter/lib/update-workflow.ts"
  )

  assert.deepEqual(
    parseUpdateWorkflowInput({
      ...input(),
      workspaceSid: ` ${workspaceSid} `,
      workflowSid: ` ${workflowSid} `,
      friendlyName: " Atendimento atualizado ",
      assignmentCallbackUrl: " https://example.com/assign ",
    }),
    input()
  )

  for (const invalid of [
    null,
    {},
    { ...input(), workspaceSid: "WSbad" },
    { ...input(), workflowSid: "WWbad" },
    { ...input(), friendlyName: " " },
    { ...input(), friendlyName: "x".repeat(257) },
    { ...input(), assignmentCallbackUrl: "javascript:alert(1)" },
    { ...input(), fallbackAssignmentCallbackUrl: "relative/path" },
    { ...input(), taskReservationTimeout: 0 },
    { ...input(), taskReservationTimeout: 86_401 },
    { ...input(), taskReservationTimeout: 1.5 },
    { ...input(), configuration: "" },
    { ...input(), configuration: "x".repeat(1_000_001) },
    { ...input(), reEvaluateTasks: "true" },
    { ...input(), expectedDateUpdated: "yesterday" },
  ]) {
    assert.equal(parseUpdateWorkflowInput(invalid), null)
  }
})

test("workflow update detects a concurrent remote change before writing", async () => {
  let updates = 0
  const client = createClient({
    current: workflow({ dateUpdated: "2026-10-14T12:01:00.000Z" }),
    update: async () => {
      updates++
      return workflow()
    },
  })
  const { updateWorkflow } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("features/taskrouter/lib/update-workflow.ts")

  await assert.rejects(
    updateWorkflow(input(), client),
    (error) => error.name === "AppError" && error.statusCode === 409
  )
  assert.equal(updates, 0)
})

test("workflow update validates referenced queues and sends one explicit write", async () => {
  const queueFetches = []
  const updates = []
  const client = createClient({
    fetchQueue: async (sid) => {
      queueFetches.push(sid)
      return { sid }
    },
    update: async (changes) => {
      updates.push(changes)
      return workflow({
        friendlyName: changes.friendlyName,
        assignmentCallbackUrl: null,
        configuration: changes.configuration,
        dateUpdated: "2026-10-14T13:00:00.000Z",
      })
    },
  })
  const { updateWorkflow } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("features/taskrouter/lib/update-workflow.ts")

  const changedConfiguration = configuration({ priority: 20 })
  const result = await updateWorkflow(
    input({
      assignmentCallbackUrl: null,
      configuration: changedConfiguration,
      reEvaluateTasks: true,
    }),
    client
  )

  assert.deepEqual(queueFetches, [queueSid])
  assert.equal(updates.length, 1)
  assert.deepEqual(updates[0], {
    friendlyName: "Atendimento atualizado",
    assignmentCallbackUrl: "",
    configuration: changedConfiguration,
    reEvaluateTasks: "true",
  })
  assert.equal(result.reEvaluatedTasks, true)
  assert.equal(result.workflow.friendlyName, "Atendimento atualizado")
  assert.equal(result.workflow.assignmentCallbackUrl, null)
  assert.equal(result.workflow.parsedConfiguration.task_routing.filters[0].targets[0].priority, 20)
})

test("workflow update rejects missing queues and malformed routing without writing", async () => {
  for (const [nextConfiguration, fetchQueue] of [
    [
      configuration({ queue: missingQueueSid }),
      async () => {
        throw { status: 404 }
      },
    ],
    [
      JSON.stringify({
        task_routing: {
          filters: [{ expression: "type == 'support'", targets: [] }],
        },
      }),
      undefined,
    ],
  ]) {
    let updates = 0
    const client = createClient({
      fetchQueue,
      update: async () => {
        updates++
        return workflow()
      },
    })
    const { updateWorkflow } = createLoader({
      "@/lib/twilio-client": { getTwilioClient: () => client },
    })("features/taskrouter/lib/update-workflow.ts")

    await assert.rejects(
      updateWorkflow(input({ configuration: nextConfiguration }), client),
      (error) => error.name === "AppError" && error.statusCode === 400
    )
    assert.equal(updates, 0)
  }
})

test("workflow update does not write when no field changed", async () => {
  let updates = 0
  const client = createClient({
    update: async () => {
      updates++
      return workflow()
    },
  })
  const { updateWorkflow } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("features/taskrouter/lib/update-workflow.ts")

  await assert.rejects(
    updateWorkflow(
      input({
        friendlyName: "Atendimento",
        assignmentCallbackUrl: "https://example.com/assign",
      }),
      client
    ),
    (error) => error.name === "AppError" && error.statusCode === 400
  )
  assert.equal(updates, 0)
})

test("workflow update route validates before creating the Twilio client", async () => {
  let clientCalls = 0
  const POST = createLoader({
    "@/lib/twilio-client": {
      getTwilioClient: () => {
        clientCalls++
        return createClient()
      },
    },
  })("app/api/taskrouter/workflows/update/route.ts").POST

  for (const body of [
    null,
    [],
    {},
    { ...input(), ...credentials, configuration: "{" },
    { ...input(), ...credentials, assignmentCallbackUrl: "ftp://example.com" },
  ]) {
    assert.equal((await POST(request(body))).status, 400)
  }
  assert.equal(clientCalls, 0)
})

test("workflow update route returns the updated safe representation", async () => {
  const client = createClient()
  const POST = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("app/api/taskrouter/workflows/update/route.ts").POST

  const response = await POST(request({ ...input(), ...credentials }))
  const result = await response.json()

  assert.equal(response.status, 200)
  assert.equal(result.workflow.friendlyName, "Atendimento atualizado")
  assert.equal(result.reEvaluatedTasks, false)
  assert.equal("authToken" in result, false)
})

test("workflow update route preserves a safe conflict response", async () => {
  const client = createClient({
    current: workflow({ dateUpdated: "2026-10-14T12:01:00.000Z" }),
  })
  const POST = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("app/api/taskrouter/workflows/update/route.ts").POST

  const response = await POST(request({ ...input(), ...credentials }))
  const result = await response.json()

  assert.equal(response.status, 409)
  assert.equal(typeof result.error, "string")
  assert.equal(JSON.stringify(result).includes(credentials.authToken), false)
})

test("workflow update route sanitizes upstream failures", async () => {
  const secret = `upstream ${credentials.authToken}`
  const client = createClient({
    update: async () => {
      throw { status: 500, message: secret }
    },
  })
  const POST = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("app/api/taskrouter/workflows/update/route.ts").POST

  const response = await POST(request({ ...input(), ...credentials }))
  const text = await response.text()

  assert.equal(response.status, 500)
  assert.equal(text.includes(secret), false)
  assert.equal(text.includes(credentials.authToken), false)
})
