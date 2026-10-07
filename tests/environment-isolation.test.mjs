import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const historyForms = [
  "features/conversations/components/close-form.tsx",
  "features/conversations/components/fetch-by-participant-form.tsx",
  "features/taskrouter/components/assign-workers-form.tsx",
  "features/taskrouter/components/cancel-queue-tasks-form.tsx",
  "features/taskrouter/components/create-workflow-form.tsx",
  "features/taskrouter/components/add-particular-filter-form.tsx",
  "features/taskrouter/components/fetch-worker-form.tsx",
  "features/taskrouter/components/search-tasks-form.tsx",
  "features/flex/components/create-address-config-form.tsx",
]

test("operation histories use independent keys without rewriting legacy data", () => {
  const values = new Map()
  global.window = {}
  global.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }

  try {
    const { environmentHistoryKey, pushHistory, readHistory } = createLoader()(
      "lib/operation-history.ts"
    )
    const base = "switchboard:test-history"
    const first = environmentHistoryKey(base, "environment-a")
    const second = environmentHistoryKey(base, "environment-b")
    values.set(base, JSON.stringify([{ value: "legacy" }]))

    pushHistory(first, { value: "first" })
    pushHistory(second, { value: "second" })

    assert.deepEqual(readHistory(first), [{ value: "first" }])
    assert.deepEqual(readHistory(second), [{ value: "second" }])
    assert.deepEqual(readHistory(base), [{ value: "legacy" }])
  } finally {
    delete global.window
    delete global.localStorage
  }
})

test("every operation history is scoped to the selected environment", () => {
  for (const file of historyForms) {
    const source = readFileSync(file, "utf8")
    assert.match(source, /environmentHistoryKey\(HISTORY_KEY, activeEnvironment\.id\)/)
    assert.doesNotMatch(source, /pushHistory\(HISTORY_KEY/)
    assert.doesNotMatch(source, /removeItem\(HISTORY_KEY/)
  }
})

test("environment changes remount page state and in-flight requests are abortable", () => {
  const shell = readFileSync("components/app-shell.tsx", "utf8")
  const context = readFileSync("features/environments/context.tsx", "utf8")
  assert.match(shell, /activeEnvironmentRevision/)
  assert.match(shell, /key={`\$\{activeEnvironment\?\.id/)
  assert.match(context, /if \(activeId === id\) bumpActiveEnvironmentRevision\(\)/)

  const requestOwners = [
    ...historyForms.filter(file => !file.includes("fetch-by-participant")),
    "features/numbers/components/list-numbers-form.tsx",
  ]
  for (const file of requestOwners) {
    const source = readFileSync(file, "utf8")
    assert.match(source, /AbortController/)
    assert.match(source, /abortRef\.current\?\.abort\(\)/)
  }
})
