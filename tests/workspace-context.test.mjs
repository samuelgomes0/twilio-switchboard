import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"
import { componentHarness } from "./component-harness.mjs"

const sid = `WS${"1".repeat(32)}`
const otherSid = `WS${"2".repeat(32)}`
const credentials = {
  accountSid: `AC${"1".repeat(32)}`,
  authToken: "0".repeat(32),
}
const environment = { id: "environment-a", name: "Teste", ...credentials }
const workspace = { sid, friendlyName: "Atendimento" }
const request = (body) =>
  new Request("http://localhost/api/taskrouter/workspaces/list", {
    method: "POST",
    body: JSON.stringify(body),
  })
const tick = () => new Promise((resolve) => setImmediate(resolve))

function browser(t) {
  const keys = [
    "window",
    "localStorage",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ]
  const previous = new Map(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  )
  const storage = new Map()
  const events = []
  const frames = []
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dispatchEvent: (event) => events.push(event.type),
      location: { href: "http://localhost/taskrouter/manage-workers" },
      history: { replaceState() {} },
    },
  })
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  })
  globalThis.requestAnimationFrame = (callback) => {
    frames.push(callback)
    return frames.length
  }
  globalThis.cancelAnimationFrame = () => {}
  t.after(() => {
    for (const key of keys) {
      const descriptor = previous.get(key)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  return {
    storage,
    events,
    flush: () => {
      while (frames.length) frames.shift()()
    },
  }
}

test("Workspace listing maps only public selection fields and opaque pagination", async () => {
  let options
  const { listWorkspaces } = createLoader()(
    "features/taskrouter/lib/workspaces.ts"
  )
  const result = await listWorkspaces(
    {
      taskrouter: {
        v1: {
          workspaces: {
            page: async (input) => {
              options = input
              return {
                instances: [
                  {
                    ...workspace,
                    accountSid: credentials.accountSid,
                    extra: "internal",
                  },
                ],
                nextPageUrl:
                  "https://taskrouter.twilio.com/v1/Workspaces?PageToken=opaque%20next",
              }
            },
          },
        },
      },
    },
    "opaque current"
  )
  assert.deepEqual(options, { pageSize: 50, pageToken: "opaque current" })
  assert.deepEqual(result, {
    workspaces: [workspace],
    nextPageToken: "opaque next",
  })
})

test("Workspace route rejects malformed bodies, credentials and page tokens before creating a client", async () => {
  let clients = 0
  const { POST } = createLoader({
    "@/lib/twilio-client": {
      getTwilioClient: () => {
        clients++
        return {}
      },
    },
  })("app/api/taskrouter/workspaces/list/route.ts")
  for (const body of [
    null,
    [],
    {},
    { ...credentials, pageToken: 7 },
    { ...credentials, pageToken: "" },
    { ...credentials, pageToken: "x".repeat(2049) },
    { ...credentials, accountSid: "ACbad" },
  ]) {
    assert.equal((await POST(request(body))).status, 400)
  }
  assert.equal(
    (await POST(new Request("http://localhost", { method: "POST", body: "{" })))
      .status,
    400
  )
  assert.equal(clients, 0)
})

test("Workspace route forwards credentials in the body and sanitizes upstream failures", async () => {
  const received = []
  const client = {}
  const route = (failure = false) =>
    createLoader({
      "@/lib/twilio-client": {
        getTwilioClient: (...args) => {
          received.push(args)
          return client
        },
      },
      "@/features/taskrouter/lib/workspaces": {
        listWorkspaces: async (...args) => {
          assert.deepEqual(args, [client, "opaque"])
          if (failure) throw new Error(credentials.authToken)
          return { workspaces: [workspace], nextPageToken: null }
        },
      },
    })("app/api/taskrouter/workspaces/list/route.ts").POST
  const response = await route()(
    request({ ...credentials, pageToken: "opaque" })
  )
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    workspaces: [workspace],
    nextPageToken: null,
  })
  assert.deepEqual(received[0], [credentials.accountSid, credentials.authToken])
  const failed = await route(true)(
    request({ ...credentials, pageToken: "opaque" })
  )
  assert.equal(failed.status, 500)
  assert.equal((await failed.text()).includes(credentials.authToken), false)
})

test("Workspace storage is scoped, rejects corrupt records and preserves legacy suggestions", (t) => {
  const { storage, events } = browser(t)
  const { readSelectedWorkspace, saveSelectedWorkspace } = createLoader()(
    "features/taskrouter/lib/workspace-storage.ts"
  )
  storage.set("switchboard:workspace-sids", JSON.stringify([sid]))
  assert.equal(readSelectedWorkspace("a"), null)
  assert.equal(saveSelectedWorkspace("a", workspace), true)
  assert.equal(
    saveSelectedWorkspace("b", { sid: otherSid, friendlyName: "Outra conta" }),
    true
  )
  assert.deepEqual(readSelectedWorkspace("a"), workspace)
  assert.equal(readSelectedWorkspace("b").sid, otherSid)
  assert.equal(storage.get("switchboard:workspace-sids"), JSON.stringify([sid]))
  for (const raw of [
    "{",
    "[]",
    '{"sid":"WSbad","friendlyName":"Invalid"}',
    JSON.stringify({ sid, friendlyName: 4 }),
  ]) {
    storage.set("switchboard:taskrouter-workspace:c", raw)
    assert.equal(readSelectedWorkspace("c"), null)
  }
  assert.ok(events.includes("switchboard:storage-error"))
  localStorage.setItem = () => {
    throw new Error("quota")
  }
  assert.equal(
    saveSelectedWorkspace("a", { sid: otherSid, friendlyName: "Novo" }),
    false
  )
  assert.deepEqual(readSelectedWorkspace("a"), workspace)
})

test("Workspace provider restores only its environment selection and persists manual choices", (t) => {
  const { storage, flush } = browser(t)
  storage.set(
    `switchboard:taskrouter-workspace:${environment.id}`,
    JSON.stringify(workspace)
  )
  const create = (id) =>
    componentHarness(
      "features/taskrouter/components/workspace-context.tsx",
      "TaskrouterWorkspaceProvider",
      {
        "@/features/environments/context": {
          useEnvironment: () => ({ activeEnvironment: { ...environment, id } }),
        },
      },
      { children: "content" }
    )
  const first = create(environment.id)
  assert.equal(first.render().props.value.selectedWorkspace, null)
  first.flushEffects()
  flush()
  assert.deepEqual(first.render().props.value.selectedWorkspace, workspace)
  first
    .render()
    .props.value.selectWorkspace({ sid: otherSid, friendlyName: "Financeiro" })
  assert.equal(first.render().props.value.selectedWorkspace.sid, otherSid)
  const second = create("environment-b")
  second.render()
  second.flushEffects()
  flush()
  assert.equal(second.render().props.value.selectedWorkspace, null)
  assert.equal(
    JSON.parse(
      storage.get(`switchboard:taskrouter-workspace:${environment.id}`)
    ).sid,
    otherSid
  )
  first.dispose()
  second.dispose()
})

test("Workspace selector loads names and pages only on request; selection never triggers an operation", async (t) => {
  const previous = globalThis.fetch
  const calls = []
  const selected = []
  const changes = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) })
    return Response.json({
      workspaces: [
        calls.length === 1
          ? workspace
          : { sid: otherSid, friendlyName: "Financeiro" },
      ],
      nextPageToken: calls.length === 1 ? "page-2" : null,
    })
  }
  t.after(() => {
    globalThis.fetch = previous
  })
  const harness = componentHarness(
    "features/taskrouter/components/workspace-input.tsx",
    "WorkspaceInput",
    {
      "@/features/environments/context": {
        useEnvironment: () => ({ activeEnvironment: environment }),
      },
      "./workspace-context": {
        useTaskrouterWorkspace: () => ({
          selectedWorkspace: null,
          selectWorkspace: (item) => selected.push(item),
        }),
      },
    },
    {
      id: "workspace",
      storageKey: "unused",
      value: "",
      onChange: (value) => changes.push(value),
    }
  )
  harness.render()
  assert.equal(calls.length, 0)
  harness.find((node) => node.props?.action === "refresh").props.onClick()
  await tick()
  harness.render()
  assert.equal(calls[0].url, "/api/taskrouter/workspaces/list")
  assert.deepEqual(calls[0].body, credentials)
  harness.find((node) => node.props?.action === "add").props.onClick()
  await tick()
  harness.render()
  assert.equal(calls[1].body.pageToken, "page-2")
  assert.ok(
    harness.find(
      (node) => node.type === "option" && node.props.value === otherSid
    )
  )
  harness
    .find((node) => node.props?.id === "workspace-choices")
    .props.onChange({ target: { value: sid } })
  assert.deepEqual(changes, [sid])
  assert.deepEqual(selected, [workspace])
  assert.equal(calls.length, 2)
  harness.render()
  assert.equal(
    harness.find((node) => node.props?.id === "workspace-choices"),
    null
  )
  harness.find((node) => node.props?.action === "refresh").props.onClick()
  harness.render()
  assert.ok(harness.find((node) => node.props?.id === "workspace-choices"))
  assert.equal(calls.length, 2)
  harness.dispose()
})

test("individual Worker mode requires a lookup, uses its canonical SID and keeps batch targets separate", (t) => {
  browser(t)
  const harness = componentHarness(
    "features/taskrouter/components/worker-management-form.tsx",
    "WorkerManagementForm",
    {
      "@/features/environments/context": {
        useEnvironment: () => ({ activeEnvironment: environment }),
      },
    }
  )
  let context = harness.render().props.value
  assert.equal(context.mode, "individual")
  const navigation = () => harness.find(node => node.props?.["aria-label"] === "Operações de Workers")
  assert.equal(navigation(), null)
  assert.equal(context.canWrite, false)
  assert.equal(
    context.acquireOperation("skills", () => {}),
    null
  )
  context.setWorkspaceSid(sid)
  context.setIdentifier("Nome amigável")
  context = harness.render().props.value
  const worker = {
    sid: `WK${"1".repeat(32)}`,
    workspaceSid: sid,
    friendlyName: "Agente",
    attributes: "{}",
  }
  context.setSelectedWorker(worker, sid, "Nome amigável")
  context = harness.render().props.value
  assert.equal(context.canWrite, true)
  assert.ok(navigation())
  assert.deepEqual(context.workers, [worker.sid])
  const release = context.acquireOperation("features", () => {})
  context.setMode("batch")
  context.setIdentifier("other")
  assert.equal(harness.render().props.value.mode, "individual")
  assert.equal(harness.render().props.value.identifier, "Nome amigável")
  release()
  context = harness.render().props.value
  assert.equal(context.refreshRevision, 1)
  context.setMode("batch")
  context = harness.render().props.value
  assert.deepEqual(context.workers, [""])
  context.setWorkers(["batch-a", "batch-b"])
  context = harness.render().props.value
  assert.deepEqual(context.workers, ["batch-a", "batch-b"])
  context.setMode("individual")
  context = harness.render().props.value
  assert.equal(context.identifier, "Nome amigável")
  assert.deepEqual(context.workers, [])
  assert.equal(context.canWrite, false)
  context.setIdentifier("Outro agente")
  context = harness.render().props.value
  assert.equal(context.selectedWorker, null)
  assert.equal(navigation(), null)
  assert.equal(context.canWrite, false)
  context.setMode("batch")
  context = harness.render().props.value
  assert.deepEqual(context.workers, ["batch-a", "batch-b"])
  assert.ok(navigation())
})

test("Worker state distinguishes false, zero and absent values without mutating attributes", () => {
  const { readWorkerConfiguration } = createLoader()(
    "features/taskrouter/lib/worker-configuration.ts"
  )
  const raw = JSON.stringify({
    routing: { skills: ["zero", "unset"], levels: { zero: 0 } },
    config_overrides: {
      features: {
        disabled: { enabled: false },
        unknown: {},
        active: { enabled: true },
      },
    },
  })
  assert.deepEqual(readWorkerConfiguration(raw), {
    skills: [
      { name: "zero", level: 0 },
      { name: "unset", level: null },
    ],
    features: [
      { name: "disabled", enabled: false },
      { name: "unknown", enabled: null },
      { name: "active", enabled: true },
    ],
  })
  for (const invalid of [
    "{",
    "null",
    "[]",
    '{"routing":{"skills":4}}',
    '{"config_overrides":{"features":[]}}',
  ])
    assert.equal(readWorkerConfiguration(invalid), null)
  assert.deepEqual(readWorkerConfiguration("{}"), { skills: [], features: [] })
})

test("individual Worker re-reads after a write without duplicating query history", async (t) => {
  const { storage, flush } = browser(t)
  const previous = globalThis.fetch
  let reads = 0
  const worker = {
    sid: `WK${"1".repeat(32)}`,
    workspaceSid: sid,
    friendlyName: "Agente",
    activityName: "Available",
    attributes: "{}",
    dateCreated: null,
    dateUpdated: null,
    dateStatusChanged: null,
  }
  globalThis.fetch = async () => {
    reads++
    return Response.json({
      worker: {
        ...worker,
        attributes: JSON.stringify({
          config_overrides: { features: { flag: { enabled: reads > 1 } } },
        }),
      },
    })
  }
  t.after(() => {
    globalThis.fetch = previous
  })
  const management = {
    workspaceSid: sid,
    identifier: "Nome amigável",
    runningTab: null,
    refreshRevision: 0,
    selectedWorker: null,
    setSelectedWorker(value) {
      this.selectedWorker = value
    },
    setWorkerLoading() {},
    setWorkspaceSid() {},
    setIdentifier() {},
  }
  const harness = componentHarness(
    "features/taskrouter/components/fetch-worker-form.tsx",
    "FetchWorkerForm",
    {
      "@/features/environments/context": {
        useEnvironment: () => ({ activeEnvironment: environment }),
      },
      "./worker-management-context": { useWorkerManagement: () => management },
    }
  )
  harness.render()
  harness.flushEffects()
  flush()
  harness.render()
  harness.flushEffects()
  harness
    .find((node) => typeof node.props?.onSubmit === "function")
    .props.onSubmit({ preventDefault() {} })
  await tick()
  harness.render()
  harness.flushEffects()
  assert.equal(reads, 1)
  assert.equal(management.selectedWorker.sid, worker.sid)
  management.refreshRevision++
  harness.render()
  harness.flushEffects()
  await tick()
  harness.render()
  harness.flushEffects()
  assert.equal(reads, 2)
  assert.equal(
    JSON.parse(management.selectedWorker.attributes).config_overrides.features
      .flag.enabled,
    true
  )
  const history = JSON.parse(
    storage.get(`switchboard:fetch-worker-history:${environment.id}`)
  )
  assert.equal(history.length, 1)
  harness.dispose()
})

test("individual plugin editing pre-fills an existing false override instead of enabling it", () => {
  const selectedWorker = {
    sid: `WK${"1".repeat(32)}`,
    workspaceSid: sid,
    friendlyName: "Agente",
    attributes: JSON.stringify({
      config_overrides: { features: { existing: { enabled: false } } },
    }),
  }
  const harness = componentHarness(
    "features/taskrouter/components/update-worker-feature-form.tsx",
    "UpdateWorkerFeatureForm",
    {
      "@/features/environments/context": {
        useEnvironment: () => ({ activeEnvironment: environment }),
      },
      "./worker-management-context": {
        useWorkerManagement: () => ({
          selectedWorker,
          workers: [selectedWorker.sid],
          workspaceSid: sid,
          canWrite: true,
          runningTab: null,
        }),
      },
    }
  )
  harness.render()
  harness
    .find((node) => node.props?.id === "feature-name")
    .props.onChange({ target: { value: "existing" } })
  harness.render()
  assert.equal(
    harness.find((node) => node.props?.id === "feature-enabled").props.value,
    "false"
  )
})
