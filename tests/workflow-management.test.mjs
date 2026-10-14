import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const workspaceSid = `WS${"1".repeat(32)}`
const workflowSid = `WW${"2".repeat(32)}`
const secondWorkflowSid = `WW${"3".repeat(32)}`
const thirdWorkflowSid = `WW${"4".repeat(32)}`
const queueSid = `WQ${"5".repeat(32)}`

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

test("workflow list maps safe fields, applies filters and reports truncation", async () => {
  let receivedOptions
  let receivedWorkspaceSid
  const resources = [
    workflow(),
    workflow({ sid: secondWorkflowSid, friendlyName: "Financeiro" }),
    workflow({ sid: thirdWorkflowSid, friendlyName: "Vendas" }),
  ]
  const client = {
    taskrouter: {
      v1: {
        workspaces: (sid) => {
          receivedWorkspaceSid = sid
          return {
            workflows: {
              list: async (options) => {
                receivedOptions = options
                return resources
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
    limit: 2,
  })

  assert.equal(receivedWorkspaceSid, workspaceSid)
  assert.deepEqual(receivedOptions, {
    friendlyName: "Atendimento",
    limit: 3,
  })
  assert.equal(result.hasMore, true)
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
