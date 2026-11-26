import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const { taskInvestigationLinks } = createLoader()("features/taskrouter/lib/task-investigation-links.ts")
const sid = prefix => prefix + "1".repeat(32)
const task = { workspaceSid: sid("WS"), workflowSid: sid("WW"), attributes: "{}" }

test("investigation links carry exact resource identifiers and source environment", () => {
  const links = taskInvestigationLinks({ ...task, attributes: JSON.stringify({ conversationSid: sid("CH"), authToken: "must-not-travel" }) }, "source environment")
  const conversation = new URL(links.conversation, "http://localhost")
  assert.equal(conversation.pathname, "/conversations/consult-by-sid")
  assert.deepEqual(Object.fromEntries(conversation.searchParams), { environmentId: "source environment", sid: sid("CH") })
  assert.ok(!JSON.stringify(links).includes("must-not-travel"))
})

test("recognized Conversation attribute names produce links without guessing from arbitrary data", () => {
  for (const key of ["conversationSid", "conversation_id", "channelSid"]) {
    assert.ok(taskInvestigationLinks({ ...task, attributes: JSON.stringify({ [key]: sid("CH") }) }, "source").conversation)
  }
  for (const attributes of ["invalid-json", "null", "[]", '"text"', '{"conversationSid":42}', JSON.stringify({ conversationSid: "CH/path?injection=true" }), JSON.stringify({ channelSid: sid("TC") }), JSON.stringify({ unrelated: sid("CH") })]) {
    assert.equal(taskInvestigationLinks({ ...task, attributes }, "source").conversation, null)
  }
})
