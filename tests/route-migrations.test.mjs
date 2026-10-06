import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import config from "../next.config.mjs"
import { API_ROUTES, PAGE_ROUTES } from "../lib/route-migrations.mjs"
import { createLoader } from "./typescript-loader.mjs"

test("all old page URLs redirect directly to a canonical page with their tabs preserved", async () => {
  const redirects = await config.redirects()
  assert.equal(redirects.length, Object.keys(PAGE_ROUTES).length)
  for (const { source, destination, permanent } of redirects) {
    assert.equal(destination, PAGE_ROUTES[source])
    assert.equal(permanent, true)
    const url = new URL(destination, "http://localhost")
    assert.ok(existsSync(`app/(pages)${url.pathname}/page.tsx`), destination)
    assert.ok(!Object.hasOwn(PAGE_ROUTES, url.pathname), "redirect must not create a chain")
  }
  assert.equal(new URL(PAGE_ROUTES["/conversations/history"], "http://localhost").searchParams.get("tab"), "messages")
  assert.equal(new URL(PAGE_ROUTES["/taskrouter/assign-workers"], "http://localhost").searchParams.get("tab"), "skills")
})

test("every legacy POST route calls the same handler as its canonical route without HTTP redirects", () => {
  const helpers = createLoader()
  const load = createLoader({
    "./map-task": helpers("features/taskrouter/lib/map-task.ts"),
    "./infer-channel": helpers("features/taskrouter/lib/infer-channel.ts"),
  })
  for (const [legacy, canonical] of Object.entries(API_ROUTES)) {
    const current = load(`app${canonical}/route.ts`)
    const previous = load(`app${legacy}/route.ts`)
    assert.equal(typeof current.POST, "function", canonical)
    assert.equal(previous.POST, current.POST, legacy)
    assert.deepEqual(Object.keys(current), ["POST"], "only POST is exposed")
  }
})

test("navigation and browser requests use canonical routes", () => {
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name)
      if (entry.isDirectory()) inspect(filename)
      else if (/\.tsx?$/.test(filename)) {
        const source = readFileSync(filename, "utf8")
        for (const legacy of [...Object.keys(PAGE_ROUTES), ...Object.keys(API_ROUTES)]) {
          assert.ok(!source.includes(`"${legacy}"`) && !source.includes(`"${legacy}?`), `${filename} still references ${legacy}`)
        }
      }
    }
  }
  inspect("features")
  inspect("components")
})
