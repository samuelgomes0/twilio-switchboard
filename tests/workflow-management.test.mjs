import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const workspaceSid = `WS${"1".repeat(32)}`
const workflowSid = `WW${"2".repeat(32)}`
const secondWorkflowSid = `WW${"3".repeat(32)}`
const queueSid = `WQ${"5".repeat(32)}`
const credentials = {
  accountSid: `AC${"6".repeat(32)}`,
  authToken: "7".repeat(32),
}

function request(body) {
  return new Request("http://localhost/api/taskrouter/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function workflowRoute(action, clientFactory, operation) {
  return createLoader({
    "@/lib/twilio-client": { getTwilioClient: clientFactory },
    "@/features/taskrouter/lib/workflows": {
      [action === "list" ? "listWorkflows" : "getWorkflow"]: operation,
    },
  })(`app/api/taskrouter/workflows/${action}/route.ts`).POST
}

const validConfiguration = JSON.stringify({
  metadata: { owner: "operations", version: 2 },
  task_routing: {
    filters: [
      {
        filter_friendly_name: "Suporte",
        expression: "type == 'support'",
        custom_filter_option: true,
        targets: [
          {
            queue: queueSid,
            priority: 10,
            timeout: "30",
            known_worker_sid: "task.worker_sid",
          },
        ],
      },
    ],
    default_filter: { queue: queueSid },
  },
})

function workflow(overrides = {}) {
  return {
    sid: workflowSid,
    workspaceSid,
    friendlyName: "Atendimento",
    assignmentCallbackUrl: "https://example.com/assign",
    fallbackAssignmentCallbackUrl: null,
    taskReservationTimeout: 120,
    configuration: validConfiguration,
    dateCreated: new Date("2026-10-10T10:00:00Z"),
    dateUpdated: "2026-10-11T11:30:00Z",
    ...overrides,
  }
}

test("workflow configuration preserves supported and unknown JSON fields", () => {
  const { parseWorkflowConfiguration } = createLoader()(
    "features/taskrouter/lib/workflow-configuration.ts"
  )
  const result = parseWorkflowConfiguration(validConfiguration)

  assert.equal(result.ok, true)
  assert.deepEqual(result.configuration.metadata, {
    owner: "operations",
    version: 2,
  })
  assert.equal(
    result.configuration.task_routing.filters[0].targets[0]
      .known_worker_sid,
    "task.worker_sid"
  )
  assert.equal(
    result.configuration.task_routing.filters[0].custom_filter_option,
    true
  )
})

test("workflow configuration distinguishes malformed JSON from invalid structure", () => {
  const { isWorkflowConfiguration, parseWorkflowConfiguration } =
    createLoader()("features/taskrouter/lib/workflow-configuration.ts")

  assert.deepEqual(parseWorkflowConfiguration("{"), {
    ok: false,
    issue: "invalid-json",
  })
  for (const configuration of [
    "null",
    "[]",
    "{}",
    '{"task_routing":null}',
    '{"task_routing":{"filters":{}}}',
    '{"task_routing":{"filters":[{"targets":[{"timeout":false}]}]}}',
  ]) {
    assert.deepEqual(parseWorkflowConfiguration(configuration), {
      ok: false,
      issue: "invalid-structure",
    })
  }
  assert.equal(
    isWorkflowConfiguration({
      task_routing: {},
      metadata: new Date("2026-10-10T10:00:00Z"),
    }),
    false
  )
})

test("workflow configuration serialization is stable and keeps array order", () => {
  const { parseWorkflowConfiguration, stringifyWorkflowConfiguration } =
    createLoader()("features/taskrouter/lib/workflow-configuration.ts")
  const first = parseWorkflowConfiguration(
    '{"z":1,"task_routing":{"filters":[{"expression":"first"},{"expression":"second"}]},"a":2}'
  )
  const second = parseWorkflowConfiguration(
    '{"a":2,"task_routing":{"filters":[{"expression":"first"},{"expression":"second"}]},"z":1}'
  )

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.equal(
    stringifyWorkflowConfiguration(first.configuration),
    stringifyWorkflowConfiguration(second.configuration)
  )
  assert.deepEqual(
    JSON.parse(stringifyWorkflowConfiguration(first.configuration)).task_routing
      .filters.map((filter) => filter.expression),
    ["first", "second"]
  )
})

test("workflow list maps safe fields and forwards opaque pagination", async () => {
  let receivedOptions
  let receivedWorkspaceSid
  const instances = [
    workflow(),
    workflow({ sid: secondWorkflowSid, friendlyName: "Financeiro" }),
  ]
  const client = {
    taskrouter: {
      v1: {
        workspaces: (sid) => {
          receivedWorkspaceSid = sid
          return {
            workflows: {
              page: async (options) => {
                receivedOptions = options
                return {
                  instances,
                  nextPageUrl:
                    "https://taskrouter.twilio.com/v1/Workflows?PageToken=next-token&PageSize=50",
                }
              },
            },
          }
        },
      },
    },
  }
  const { listWorkflows } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("features/taskrouter/lib/workflows.ts")

  const result = await listWorkflows(workspaceSid, client, {
    friendlyName: "Atendimento",
    pageToken: "current-token",
  })

  assert.equal(receivedWorkspaceSid, workspaceSid)
  assert.deepEqual(receivedOptions, {
    friendlyName: "Atendimento",
    pageToken: "current-token",
    pageSize: 50,
  })
  assert.equal(result.nextPageToken, "next-token")
  assert.deepEqual(
    result.workflows.map((item) => item.sid),
    [workflowSid, secondWorkflowSid]
  )
  assert.equal(result.workflows[0].dateCreated, "2026-10-10T10:00:00.000Z")
  assert.equal(result.workflows[0].dateUpdated, "2026-10-11T11:30:00.000Z")
  assert.equal("configuration" in result.workflows[0], false)
})

test("workflow details expose valid parsed configuration without losing raw JSON", async () => {
  let receivedWorkflowSid
  const resource = workflow()
  const workflows = (sid) => {
    receivedWorkflowSid = sid
    return { fetch: async () => resource }
  }
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({ workflows }),
      },
    },
  }
  const { getWorkflow } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("features/taskrouter/lib/workflows.ts")

  const result = await getWorkflow(workspaceSid, workflowSid, client)

  assert.equal(receivedWorkflowSid, workflowSid)
  assert.equal(result.configuration, validConfiguration)
  assert.equal(result.configurationIssue, null)
  assert.equal(result.parsedConfiguration.task_routing.filters.length, 1)
})

test("workflow details retain malformed remote configuration for read-only display", async () => {
  const workflows = () => ({
    fetch: async () => workflow({ configuration: "not-json" }),
  })
  const client = {
    taskrouter: {
      v1: {
        workspaces: () => ({ workflows }),
      },
    },
  }
  const { getWorkflow } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => client },
  })("features/taskrouter/lib/workflows.ts")

  const result = await getWorkflow(workspaceSid, workflowSid, client)

  assert.equal(result.configuration, "not-json")
  assert.equal(result.parsedConfiguration, null)
  assert.equal(result.configurationIssue, "invalid-json")
})

test("workflow list route rejects malformed input before creating a client", async () => {
  let clientCalls = 0
  const POST = workflowRoute(
    "list",
    () => {
      clientCalls++
      return {}
    },
    async () => ({ workflows: [], nextPageToken: null })
  )
  const invalidBodies = [
    null,
    [],
    {},
    { workspaceSid, ...credentials, pageToken: 1 },
    { workspaceSid, ...credentials, pageToken: "" },
    { workspaceSid, ...credentials, pageToken: "x".repeat(2049) },
    { workspaceSid: "WSbad", ...credentials },
    { workspaceSid, accountSid: "ACbad", authToken: credentials.authToken },
  ]

  for (const body of invalidBodies) {
    assert.equal((await POST(request(body))).status, 400)
  }
  assert.equal(
    (
      await POST(
        new Request("http://localhost", { method: "POST", body: "{" })
      )
    ).status,
    400
  )
  assert.equal(clientCalls, 0)
})

test("workflow list route forwards credentials and opaque pagination", async () => {
  const client = {}
  const clientArguments = []
  const operationArguments = []
  const result = { workflows: [], nextPageToken: "next-token" }
  const POST = workflowRoute(
    "list",
    (...args) => {
      clientArguments.push(args)
      return client
    },
    async (...args) => {
      operationArguments.push(args)
      return result
    }
  )

  const response = await POST(
    request({
      workspaceSid: ` ${workspaceSid} `,
      pageToken: "opaque token",
      ...credentials,
    })
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), result)
  assert.deepEqual(clientArguments, [
    [credentials.accountSid, credentials.authToken],
  ])
  assert.deepEqual(operationArguments, [
    [workspaceSid, client, { pageToken: "opaque token" }],
  ])
})

test("workflow detail route validates both SIDs and forwards trimmed values", async () => {
  let clientCalls = 0
  const client = {}
  const operationArguments = []
  const POST = workflowRoute(
    "get",
    () => {
      clientCalls++
      return client
    },
    async (...args) => {
      operationArguments.push(args)
      return { sid: workflowSid }
    }
  )

  for (const body of [
    { workspaceSid, ...credentials },
    { workspaceSid, workflowSid: "WWbad", ...credentials },
    { workspaceSid: "WSbad", workflowSid, ...credentials },
  ]) {
    assert.equal((await POST(request(body))).status, 400)
  }
  assert.equal(clientCalls, 0)

  const response = await POST(
    request({
      workspaceSid: ` ${workspaceSid} `,
      workflowSid: ` ${workflowSid} `,
      ...credentials,
    })
  )
  assert.equal(response.status, 200)
  assert.deepEqual(operationArguments, [[workspaceSid, workflowSid, client]])
})

test("workflow routes sanitize credential, upstream, and not-found failures", async () => {
  const secret = `upstream ${credentials.authToken}`
  const cases = [
    workflowRoute(
      "list",
      () => {
        throw new Error(secret)
      },
      async () => ({ workflows: [], nextPageToken: null })
    ),
    workflowRoute(
      "list",
      () => ({}),
      async () => {
        throw new Error(secret)
      }
    ),
  ]

  for (const POST of cases) {
    const response = await POST(request({ workspaceSid, ...credentials }))
    assert.equal(response.status, 500)
    const text = await response.text()
    assert.equal(text.includes(secret), false)
    assert.equal(text.includes(credentials.authToken), false)
  }

  const notFound = workflowRoute(
    "get",
    () => ({}),
    async () => {
      throw { status: 404, message: secret }
    }
  )
  const response = await notFound(
    request({ workspaceSid, workflowSid, ...credentials })
  )
  assert.equal(response.status, 404)
  const text = await response.text()
  assert.equal(text.includes(secret), false)
  assert.equal(text.includes(credentials.authToken), false)
})
