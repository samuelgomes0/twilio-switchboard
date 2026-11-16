import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

function setup(statuses, { failList = false, failSid, failEventSid } = {}) {
  const constants = createLoader()("lib/constants.ts")
  const load = createLoader({ "@/lib/constants": { ...constants, RETRY_DELAY_MS: 0 } })
  const { cancelQueueTasks } = load("features/taskrouter/lib/cancel-queue-tasks.ts")
  const { strings } = load("lib/strings.ts")
  const tasks = Object.freeze(statuses.map((assignmentStatus, index) => Object.freeze({
    sid: `task-${index}`, assignmentStatus, attributes: "{}",
  })))
  const updates = []
  const events = []
  let reads = 0
  const resource = sid => ({
    async update(payload) {
      updates.push({ sid, payload })
      if (sid === failSid) throw new Error("synthetic failure")
      return {}
    },
  })
  resource.list = async () => {
    reads++
    if (failList) throw new Error("synthetic list failure")
    return tasks
  }
  const client = { taskrouter: { v1: { workspaces: () => ({ tasks: resource }) } } }
  return {
    tasks, updates, events, constants,
    reads: () => reads,
    run: () => cancelQueueTasks({ workspaceSid: "workspace", taskQueueName: "queue" }, client, event => {
      const payload = JSON.parse(event.slice(5))
      if (failEventSid && payload.message === strings.taskrouter.cancelQueueTasks.log.noConversation(failEventSid)) {
        throw new Error("synthetic individual rejection")
      }
      events.push(payload)
    }),
  }
}

test("mixed tasks process only pending/reserved and count every other status as skipped", async () => {
  const fixture = setup(["pending", "reserved", "assigned", "wrapping", "completed", "canceled", "other", null])
  assert.deepEqual(await fixture.run(), { totalSuccess: 2, totalSkipped: 6, totalErrors: 0, partial: false })
  assert.deepEqual(fixture.updates.map(({ sid }) => sid), ["task-0", "task-1"])
  assert.ok(fixture.updates.every(({ payload }) => payload.assignmentStatus === "canceled"))
  assert.deepEqual(fixture.events.filter(event => event.progress).map(event => event.progress), [
    { current: 1, total: 2 }, { current: 2, total: 2 },
  ])
  assert.equal(fixture.reads(), 1)
  assert.equal(fixture.tasks[0].assignmentStatus, "pending")
})

test("noncancellable and empty lists return skipped totals without writes", async () => {
  for (const statuses of [[], ["assigned", "wrapping", "completed", "canceled", "other", null]]) {
    const fixture = setup(statuses)
    assert.deepEqual(await fixture.run(), { totalSuccess: 0, totalSkipped: statuses.length, totalErrors: 0, partial: false })
    assert.deepEqual(fixture.updates, [])
    assert.equal(fixture.events.some(event => event.progress), false)
  }
})

test("individual cancellation failure increments errors while successful and skipped counts survive", async () => {
  const fixture = setup(["pending", "reserved", "completed"], { failSid: "task-1" })
  assert.deepEqual(await fixture.run(), { totalSuccess: 1, totalSkipped: 1, totalErrors: 1, partial: false })
  assert.equal(fixture.updates.filter(({ sid }) => sid === "task-1").length, 1)
  assert.equal(fixture.updates.filter(({ sid }) => sid === "task-0").length, 1)
  assert.equal(fixture.events.filter(event => event.progress).length, 2)
})

test("rejected individual processing is counted as an error by the batch aggregator", async () => {
  const fixture = setup(["pending", "reserved", "completed"], { failEventSid: "task-1" })
  assert.deepEqual(await fixture.run(), { totalSuccess: 1, totalSkipped: 1, totalErrors: 1, partial: false })
  assert.equal(fixture.updates.length, 2)
})

test("listing failure preserves the existing error result without writes", async () => {
  const fixture = setup([], { failList: true })
  assert.deepEqual(await fixture.run(), { totalSuccess: 0, totalSkipped: 0, totalErrors: 1, partial: false })
  assert.deepEqual(fixture.updates, [])
  assert.equal(fixture.reads(), fixture.constants.RETRY_ATTEMPTS)
})

test("lists one extra task to report an incomplete destructive batch", async () => {
  const fixture = setup(Array.from({ length: 1001 }, () => "pending"))
  const result = await fixture.run()
  assert.deepEqual(result, {
    totalSuccess: 1000,
    totalSkipped: 0,
    totalErrors: 0,
    partial: true,
  })
  assert.equal(fixture.updates.length, 1000)
  assert.equal(
    fixture.events.some(event => event.level === "warning"),
    true
  )
})

test("cancels every eligible task but contacts a shared Conversation only once", async () => {
  const conversationSid = `CH${"1".repeat(32)}`
  const taskWrites = []
  let messages = 0
  let closes = 0
  const tasks = ["task-1", "task-2"].map(sid => ({
    sid,
    assignmentStatus: "pending",
    attributes: JSON.stringify({ conversationSid }),
  }))
  const taskResource = sid => ({
    update: async payload => taskWrites.push({ sid, payload }),
  })
  taskResource.list = async () => tasks
  const conversationResource = () => ({
    messages: { create: async () => { messages++ } },
    update: async () => { closes++ },
  })
  const client = {
    taskrouter: { v1: { workspaces: () => ({ tasks: taskResource }) } },
    conversations: { v1: { conversations: conversationResource } },
  }
  const { cancelQueueTasks } = createLoader()(
    "features/taskrouter/lib/cancel-queue-tasks.ts"
  )

  assert.deepEqual(
    await cancelQueueTasks(
      { workspaceSid: "workspace", taskQueueName: "queue" },
      client,
      () => {}
    ),
    {
      totalSuccess: 2,
      totalSkipped: 0,
      totalErrors: 0,
      partial: false,
    }
  )
  assert.equal(taskWrites.length, 2)
  assert.equal(messages, 1)
  assert.equal(closes, 1)
})
