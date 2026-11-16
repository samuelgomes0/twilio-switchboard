import assert from "node:assert/strict"
import test from "node:test"
import { createLoader, load } from "./typescript-loader.mjs"

const fixture = "tests/fixtures/loader.ts"

test("cached loader resolves aliases and preserves exports and instanceof across imports", () => {
  const loadCached = createLoader()
  const result = loadCached(fixture)
  assert.equal(result, loadCached(fixture))
  assert.equal(result.AppError, result.RepeatedError)
  assert.equal(result.AppError, loadCached("lib/errors.ts").AppError)
  assert.ok(result.error instanceof result.AppError)
  assert.ok(result.error instanceof Error)
  assert.equal(result.filename, "fixture.ts")
})

test("uncached loaders reexecute both entry modules and repeated alias dependencies", () => {
  for (const loadUncached of [load, createLoader({}, { cache: false })]) {
    const first = loadUncached(fixture)
    const second = loadUncached(fixture)
    assert.notEqual(first, second)
    assert.notEqual(first.AppError, first.RepeatedError)
    assert.notEqual(first.AppError, second.AppError)
    assert.ok(first.error instanceof first.AppError)
    assert.equal(first.error instanceof second.AppError, false)
  }
})

test("cached contexts do not share module exports or class identity", () => {
  const first = createLoader()(fixture)
  const second = createLoader()(fixture)
  assert.notEqual(first, second)
  assert.notEqual(first.AppError, second.AppError)
  assert.equal(first.error instanceof second.AppError, false)
})

test("alias and native mocks retain identity and stay isolated between contexts", () => {
  class FirstError extends Error {}
  class SecondError extends Error {}
  for (const loadWith of [overrides => createLoader(overrides), overrides => relative => load(relative, overrides)]) {
    const first = loadWith({ "@/lib/errors": { AppError: FirstError }, "node:path": { basename: () => "first" } })(fixture)
    const second = loadWith({ "@/lib/errors": { AppError: SecondError }, "node:path": { basename: () => "second" } })(fixture)
    assert.equal(first.AppError, FirstError)
    assert.equal(first.RepeatedError, FirstError)
    assert.ok(first.error instanceof FirstError)
    assert.equal(first.error instanceof SecondError, false)
    assert.equal(second.AppError, SecondError)
    assert.equal(first.filename, "first")
    assert.equal(second.filename, "second")
  }
})

test("relative modules still require explicit mocks", () => {
  for (const loadWith of [overrides => createLoader(overrides), overrides => relative => load(relative, overrides)]) {
    assert.throws(() => loadWith({})("lib/variables.ts"), { code: "MODULE_NOT_FOUND" })
    const variables = loadWith({ "./stored-keys": load("lib/stored-keys.ts") })("lib/variables.ts")
    assert.equal(typeof variables.readVariables, "function")
  }
})

test("cache retains the original request-string keys", () => {
  const loadCached = createLoader()
  assert.notEqual(loadCached(fixture), loadCached(`./${fixture}`))
  assert.equal(loadCached(fixture).AppError, loadCached(`./${fixture}`).AppError)
})
