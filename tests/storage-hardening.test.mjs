import assert from "node:assert/strict"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

function installBrowserStorage(t, initial = {}) {
  const names = ["window", "localStorage", "CustomEvent"]
  const descriptors = new Map(
    names.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ])
  )
  const values = new Map(Object.entries(initial))
  const events = []
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  class StorageEvent {
    constructor(type) {
      this.type = type
    }
  }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: (event) => events.push(event.type) },
  })
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  })
  Object.defineProperty(globalThis, "CustomEvent", {
    configurable: true,
    value: StorageEvent,
  })
  t.after(() => {
    for (const name of names) {
      const descriptor = descriptors.get(name)
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    }
  })
  return { events, storage, values }
}

test("browser storage reports invalid data and unavailable operations", (t) => {
  const { events, storage, values } = installBrowserStorage(t, {
    malformed: "{",
    wrongShape: "{}",
  })
  const {
    readStorageJson,
    removeStorageValue,
    STORAGE_ERROR_EVENT,
    writeStorageJson,
  } = createLoader()("lib/browser-storage.ts")
  const isStringArray = (value) =>
    Array.isArray(value) && value.every((item) => typeof item === "string")

  assert.deepEqual(readStorageJson("malformed", isStringArray, []), [])
  assert.deepEqual(readStorageJson("wrongShape", isStringArray, []), [])
  assert.equal(writeStorageJson("valid", ["value"]), true)
  assert.equal(values.get("valid"), '["value"]')

  storage.setItem = () => {
    throw new Error("quota")
  }
  storage.removeItem = () => {
    throw new Error("denied")
  }
  assert.equal(writeStorageJson("valid", ["new"]), false)
  assert.equal(removeStorageValue("valid"), false)
  assert.deepEqual(events, Array(4).fill(STORAGE_ERROR_EVENT))
})

test("contacts discard corrupted records and preserve valid records", (t) => {
  const key = "switchboard:contacts"
  const { values } = installBrowserStorage(t, {
    [key]: JSON.stringify([{ id: "", name: "Contato", phone: "+5511" }]),
  })
  const { readContacts } = createLoader()("lib/contacts.ts")
  assert.deepEqual(readContacts(), [])

  const contact = { id: "contact-1", name: "Contato", phone: "+5511" }
  values.set(key, JSON.stringify([contact]))
  assert.deepEqual(readContacts(), [contact])
})

test("environment storage validates credential records and reports write results", (t) => {
  const key = "twilio-environments"
  const { storage, values } = installBrowserStorage(t, {
    [key]: JSON.stringify([
      {
        id: "env",
        name: "Produção",
        accountSid: "invalid",
        authToken: "token",
      },
    ]),
  })
  const { getEnvironments, saveEnvironments } = createLoader()(
    "features/environments/storage.ts"
  )
  assert.deepEqual(getEnvironments(), [])

  const environment = {
    id: "env",
    name: "Produção",
    accountSid: `AC${"1".repeat(32)}`,
    authToken: "token",
  }
  values.set(key, JSON.stringify([environment]))
  assert.deepEqual(getEnvironments(), [environment])
  assert.equal(saveEnvironments([environment]), true)
  storage.setItem = () => {
    throw new Error("quota")
  }
  assert.equal(saveEnvironments([environment]), false)
})

test("variable catalog covers every key with an explicit storage scope", () => {
  const load = createLoader()
  const { STORED_KEYS } = load("lib/stored-keys.ts")
  const { VARIABLE_GROUPS } = createLoader({
    "./stored-keys": { STORED_KEYS },
  })("lib/variables.ts")
  const catalogKeys = VARIABLE_GROUPS.map((group) => group.key)

  assert.equal(new Set(catalogKeys).size, catalogKeys.length)
  assert.deepEqual(new Set(catalogKeys), new Set(Object.values(STORED_KEYS)))
  assert.equal(
    VARIABLE_GROUPS.find((group) => group.key === STORED_KEYS.closeMessages)
      ?.scope,
    "global"
  )
  assert.equal(
    VARIABLE_GROUPS.filter(
      (group) => group.key !== STORED_KEYS.closeMessages
    ).every((group) => group.scope === "environment"),
    true
  )
})

test("environment mutations re-read current storage and preserve unrelated changes", async (t) => {
  const { values, storage } = installBrowserStorage(t)
  const { mutateEnvironments, getEnvironments } = createLoader()(
    "features/environments/storage.ts"
  )
  const environment = (id) => ({
    id,
    name: id,
    accountSid: `AC${"1".repeat(32)}`,
    authToken: "test",
  })
  assert.equal(
    await mutateEnvironments((current) => [...current, environment("first")]),
    true
  )
  // Another tab changes the collection after the first caller has read its UI state.
  values.set(
    "twilio-environments",
    JSON.stringify([...getEnvironments(), environment("second")])
  )
  assert.equal(
    await mutateEnvironments((current) =>
      current.map((item) =>
        item.id === "first" ? { ...item, name: "edited" } : item
      )
    ),
    true
  )
  assert.deepEqual(
    getEnvironments().map((item) => [item.id, item.name]),
    [
      ["first", "edited"],
      ["second", "second"],
    ]
  )
  const stored = values.get("twilio-environments")
  storage.setItem = () => {
    throw new Error("quota")
  }
  assert.equal(
    await mutateEnvironments((current) => [...current, environment("third")]),
    false
  )
  assert.equal(values.get("twilio-environments"), stored)
})

test("environment mutations use the same Web Lock and re-read inside its callback", async (t) => {
  installBrowserStorage(t)
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  const callbacks = []
  const locks = []
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        request(name, callback) {
          locks.push(name)
          return new Promise((resolve) =>
            callbacks.push(() => resolve(callback()))
          )
        },
      },
    },
  })
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "navigator", descriptor)
    else delete globalThis.navigator
  })
  const { mutateEnvironments, getEnvironments } = createLoader()(
    "features/environments/storage.ts"
  )
  const environment = (id) => ({
    id,
    name: id,
    accountSid: `AC${"1".repeat(32)}`,
    authToken: "test",
  })
  const first = mutateEnvironments((current) => [
    ...current,
    environment("one"),
  ])
  const second = mutateEnvironments((current) => [
    ...current,
    environment("two"),
  ])
  assert.deepEqual(locks, [
    "switchboard:environments",
    "switchboard:environments",
  ])
  callbacks.shift()()
  callbacks.shift()()
  assert.deepEqual(await Promise.all([first, second]), [true, true])
  assert.deepEqual(
    getEnvironments().map((item) => item.id),
    ["one", "two"]
  )
})

test("environment subscriptions react to cross-tab changes and unsubscribe cleanly", (t) => {
  installBrowserStorage(t)
  const listeners = new Map()
  window.addEventListener = (type, callback) => listeners.set(type, callback)
  window.removeEventListener = (type, callback) => {
    if (listeners.get(type) === callback) listeners.delete(type)
  }
  const { subscribeEnvironments } = createLoader()(
    "features/environments/storage.ts"
  )
  let changes = 0
  const unsubscribe = subscribeEnvironments(() => changes++)
  listeners.get("storage")({ key: "unrelated" })
  assert.equal(changes, 0)
  for (const key of ["twilio-environments", "twilio-active-env", null])
    listeners.get("storage")({ key })
  assert.equal(changes, 3)
  listeners.get("switchboard:environments-changed")()
  assert.equal(changes, 4)
  unsubscribe()
  assert.equal(listeners.size, 0)
})
