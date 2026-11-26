import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const workspaceSid = `WS${"1".repeat(32)}`
const credentials = {
  accountSid: `AC${"1".repeat(32)}`,
  authToken: "0".repeat(32),
}

for (const count of [0, 1, 1000, 1001]) {
  test(`task search reports truncation accurately for ${count} results`, async () => {
    let options
    const client = {
      taskrouter: {
        v1: {
          workspaces: (sid) => {
            assert.equal(sid, workspaceSid)
            return {
              tasks: {
                list: async (input) => {
                  options = input
                  return Array.from({ length: count }, (_, index) => ({
                    sid: String(index),
                    attributes: "{}",
                    taskChannelUniqueName: "chat",
                  }))
                },
              },
            }
          },
        },
      },
    }
    const { searchTasks } = createLoader({
      "@/features/taskrouter/lib/map-task": {
        mapTask: (task) => ({ sid: task.sid, attributes: {} }),
      },
    })("features/taskrouter/lib/search-tasks.ts")
    const result = await searchTasks(workspaceSid, "+5511999999999", client)
    assert.equal(options.limit, 1001)
    assert.equal(result.tasks.length, Math.min(count, 1000))
    assert.equal(result.hasMore, count > 1000)
    assert.equal(result.phone, "+5511999999999")
    assert.ok(
      options.evaluateTaskAttributes.includes('from == "+5511999999999"')
    )
  })
}

test("task search route includes the additive hasMore field without changing legacy fields", async () => {
  const result = { tasks: [], phone: "+5511999999999", hasMore: true }
  const { POST } = createLoader({
    "@/lib/twilio-client": { getTwilioClient: () => ({}) },
    "@/features/taskrouter/lib/search-tasks": {
      searchTasks: async () => result,
    },
  })("app/api/taskrouter/search-tasks-by-number/route.ts")
  const response = await POST(
    new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({
        workspaceSid,
        phoneNumber: result.phone,
        ...credentials,
      }),
    })
  )
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), result)
})
