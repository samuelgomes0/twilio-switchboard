import assert from "node:assert/strict"
import test from "node:test"
import { componentHarness } from "./component-harness.mjs"
import { clientHarness } from "./sse-client-harness.mjs"

const env = { id: "test", name: "Teste", accountSid: "", authToken: "" }
const environmentOverride = {
  "@/features/environments/context": {
    useEnvironment: () => ({ activeEnvironment: env }),
  },
}

function fakeWindow(t) {
  const previous = globalThis.window
  globalThis.window = {
    location: { href: "http://localhost/taskrouter/manage-workers" },
    history: { replaceState() {} },
  }
  t.after(() => {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  })
}

test("Workers serialize operations, freeze selection, expose cancel and release only the owning operation", (t) => {
  fakeWindow(t)
  const harness = componentHarness(
    "features/taskrouter/components/worker-management-form.tsx",
    "WorkerManagementForm",
    environmentOverride,
    { initialMode: "batch", initialTab: "skills" }
  )
  const first = harness.render().props.value
  first.setWorkers(["worker-a"])
  let cancelled = 0
  const release = first.acquireOperation("skills", () => cancelled++)
  assert.equal(typeof release, "function")
  assert.equal(
    first.acquireOperation("features", () => {}),
    null
  )
  let current = harness.render().props.value
  assert.equal(current.runningTab, "skills")
  assert.equal(
    harness.find((node) => node.props?.id === "worker-management-workspace")
      .props.disabled,
    true
  )
  assert.equal(
    harness.find((node) => node.props?.id === "shared-worker-0").props.disabled,
    true
  )
  current.openWorkerAction("features", "worker-b")
  harness.find((node) => node.props?.action === "stop").props.onClick()
  assert.equal(cancelled, 1)
  assert.deepEqual(harness.render().props.value.workers, ["worker-a"])
  release()
  assert.equal(harness.render().props.value.runningTab, null)
  const secondRelease = first.acquireOperation("features", () => {})
  release()
  assert.equal(harness.render().props.value.runningTab, "features")
  secondRelease()
  assert.equal(harness.render().props.value.runningTab, null)
})

test("skill writes do not start if the shared operation is busy and release on HTTP failure", async () => {
  const blocked = clientHarness("assign-workers", {
    management: { acquireOperation: () => null },
  })
  await blocked.run({})
  assert.equal(
    blocked.trace.some(([type]) => type === "fetch"),
    false
  )
  let released = 0
  const failed = clientHarness("assign-workers", {
    ok: false,
    management: { acquireOperation: () => () => released++ },
  })
  await failed.run({})
  assert.equal(failed.state.status, "error")
  assert.equal(released, 1)
})

test("environment save failures retain fields and allow retry without double submission", async () => {
  let calls = 0
  let finish
  const pending = new Promise((resolve) => {
    finish = resolve
  })
  const initial = {
    name: "Teste",
    accountSid: `AC${"1".repeat(32)}`,
    authToken: "0".repeat(32),
  }
  const harness = componentHarness(
    "features/environments/components/environment-form.tsx",
    "EnvironmentForm",
    {},
    {
      initial,
      onSave: async () => {
        calls++
        return calls === 1 ? pending : true
      },
      onCancel() {},
    }
  )
  harness.render()
  const submit = harness.find(
    (node) => typeof node.props?.onSubmit === "function"
  ).props.onSubmit
  const first = submit({ preventDefault() {} })
  await submit({ preventDefault() {} })
  assert.equal(calls, 1)
  finish(false)
  await first
  harness.render()
  assert.ok(harness.find((node) => node.props?.role === "alert"))
  assert.equal(
    harness.find((node) => node.props?.id === "env-name").props.value,
    initial.name
  )
  assert.equal(
    harness.find((node) => node.props?.id === "env-sid").props.value,
    initial.accountSid
  )
  assert.equal(
    harness.find((node) => node.props?.id === "env-token").props.value,
    initial.authToken
  )
  await harness
    .find((node) => typeof node.props?.onSubmit === "function")
    .props.onSubmit({ preventDefault() {} })
  harness.render()
  assert.equal(
    harness.find((node) => node.props?.role === "alert"),
    null
  )
  assert.equal(calls, 2)
})

test("the environment manager closes the editor only after a confirmed save", async () => {
  let succeeds = false
  const harness = componentHarness(
    "features/environments/components/environments-manager.tsx",
    "EnvironmentsManager",
    {
      "@/features/environments/context": {
        useEnvironment: () => ({
          environments: [],
          activeEnvironment: null,
          addEnvironment: async () => succeeds,
        }),
      },
    }
  )
  harness.render()
  harness.find((node) => node.props?.action === "add").props.onClick()
  harness.render()
  let form = harness.find((node) => typeof node.props?.onSave === "function")
  assert.equal(await form.props.onSave({}), false)
  harness.render()
  assert.ok(harness.find((node) => typeof node.props?.onSave === "function"))
  succeeds = true
  form = harness.find((node) => typeof node.props?.onSave === "function")
  assert.equal(await form.props.onSave({}), true)
  harness.render()
  assert.equal(
    harness.find((node) => typeof node.props?.onSave === "function"),
    null
  )
})

test("environment storage events refresh selection and invalidate active credential revisions", (t) => {
  const oldRaf = globalThis.requestAnimationFrame
  const oldCancel = globalThis.cancelAnimationFrame
  const frames = []
  globalThis.requestAnimationFrame = (callback) => {
    frames.push(callback)
    return frames.length
  }
  globalThis.cancelAnimationFrame = () => {}
  t.after(() => {
    if (oldRaf === undefined) delete globalThis.requestAnimationFrame
    else globalThis.requestAnimationFrame = oldRaf
    if (oldCancel === undefined) delete globalThis.cancelAnimationFrame
    else globalThis.cancelAnimationFrame = oldCancel
  })
  let environments = [
    { ...env, accountSid: `AC${"1".repeat(32)}`, authToken: "first" },
  ]
  let selected = env.id
  let refresh
  let unsubscribed = false
  const harness = componentHarness(
    "features/environments/context.tsx",
    "EnvironmentProvider",
    {
      "@/features/environments/storage": {
        getEnvironments: () => environments,
        getActiveEnvironmentId: () => selected,
        subscribeEnvironments: (callback) => {
          refresh = callback
          return () => {
            unsubscribed = true
          }
        },
      },
    },
    { children: "content" }
  )
  harness.render()
  harness.flushEffects()
  frames.shift()()
  let current = harness.render().props.value
  assert.equal(current.activeEnvironment.authToken, "first")
  const revision = current.activeEnvironmentRevision
  environments = [{ ...environments[0], authToken: "changed" }]
  refresh()
  current = harness.render().props.value
  assert.equal(current.activeEnvironment.authToken, "changed")
  assert.ok(current.activeEnvironmentRevision > revision)
  refresh()
  assert.equal(
    harness.render().props.value.activeEnvironmentRevision,
    current.activeEnvironmentRevision
  )
  selected = null
  refresh()
  assert.equal(harness.render().props.value.activeEnvironment, null)
  harness.dispose()
  assert.equal(unsubscribed, true)
})
