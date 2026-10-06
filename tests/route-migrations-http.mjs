import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { once } from "node:events"
import { API_ROUTES, PAGE_ROUTES } from "../lib/route-migrations.mjs"

// Run after npm run build; all API probes use malformed JSON to avoid Twilio calls.
const reservation = createServer()
reservation.listen(0, "127.0.0.1")
await once(reservation, "listening")
const port = reservation.address().port
await new Promise(resolve => reservation.close(resolve))
const base = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
})
server.stderr.resume()

try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Server startup timed out")), 15000)
    server.once("error", reject)
    server.once("exit", () => reject(new Error("Server exited before startup")))
    server.stdout.on("data", chunk => {
      if (String(chunk).includes("Ready in")) { clearTimeout(timeout); resolve() }
    })
  })
  const sid = "CH" + "1".repeat(32)
  const canonicalPages = new Set(["/", "/conversations", "/taskrouter", "/numbers", "/flex", "/settings"])
  for (const [source, destination] of Object.entries(PAGE_ROUTES)) {
    const response = await fetch(`${base}${source}?sid=${sid}&tab=messages`, { redirect: "manual" })
    assert.equal(response.status, 308, source)
    const redirected = new URL(response.headers.get("location"), base)
    const target = new URL(destination, base)
    assert.equal(redirected.pathname, target.pathname, source)
    assert.equal(redirected.searchParams.get("sid"), sid, source)
    assert.equal(redirected.searchParams.get("tab"), target.searchParams.get("tab") ?? "messages", source)
    canonicalPages.add(target.pathname)
    await response.body?.cancel()
  }
  for (const page of canonicalPages) {
    const response = await fetch(base + page, { redirect: "manual" })
    assert.equal(response.status, 200, page)
    await response.body?.cancel()
  }
  for (const [legacy, canonical] of Object.entries(API_ROUTES)) {
    const errors = []
    for (const endpoint of [legacy, canonical]) {
      const getResponse = await fetch(base + endpoint, { redirect: "manual" })
      assert.equal(getResponse.status, 405, endpoint)
      await getResponse.body?.cancel()
      const response = await fetch(base + endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{", redirect: "manual",
      })
      assert.equal(response.status, 400, endpoint)
      errors.push(await response.json())
    }
    assert.deepEqual(errors[0], errors[1], legacy)
  }
  process.stdout.write(`HTTP validation passed: ${Object.keys(PAGE_ROUTES).length} redirects, ${canonicalPages.size} pages and ${Object.keys(API_ROUTES).length} API pairs.\n`)
} finally {
  server.kill()
  if (server.exitCode === null && server.signalCode === null) await once(server, "exit")
}
