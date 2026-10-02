import assert from "node:assert/strict"
import fs from "node:fs"
import { pathToFileURL } from "node:url"
import { createLoader } from "./typescript-loader.mjs"

// This optional browser suite requires a temporary Playwright installation, not a production dependency.
const { chromium } = await import(pathToFileURL(`${process.env.SWITCHBOARD_PLAYWRIGHT_PATH ?? process.argv[2]}/index.mjs`))
const { strings } = createLoader()("lib/strings.ts")
const base = process.env.SWITCHBOARD_TEST_URL ?? "http://127.0.0.1:3000"
const sid = prefix => prefix + "1".repeat(32)
const WS = sid("WS"), CH = sid("CH"), WK = sid("WK"), WT = sid("WT")
const environment = { id: "redesign-test", name: "Homologação simulada", accountSid: sid("AC"), authToken: "1".repeat(32) }
const date = "2026-10-01T12:00:00.000Z"
const conversation = { sid: CH, friendlyName: "Atendimento de homologação", state: "active", dateCreated: date, dateUpdated: date, attributes: "{\"origem\":\"teste\"}", messagingServiceSid: null }
const worker = { sid: WK, workspaceSid: WS, friendlyName: "Operador de homologação", activityName: "Available", available: true, attributes: '{"routing":{"skills":["suporte"],"levels":{"suporte":2}}}', dateCreated: date, dateUpdated: date, dateStatusChanged: date }
const task = { sid: WT, workspaceSid: WS, assignmentStatus: "pending", priority: 2, age: 65, attributes: '{"from":"whatsapp:+5511999999999"}', taskQueueFriendlyName: "Suporte", workflowFriendlyName: "Atendimento", dateCreated: date, dateUpdated: date, taskChannelUniqueName: "chat", channel: "whatsapp" }
const requests = []
const failures = []
let mode = "success", delay = 0
const browser = await chromium.launch({ channel: "msedge", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" })
await context.addInitScript(env => {
  localStorage.setItem("twilio-environments", JSON.stringify([env]))
  localStorage.setItem("twilio-active-env", env.id)
  localStorage.setItem("switchboard:theme", "light")
}, environment)
const page = await context.newPage()
page.on("pageerror", e => failures.push(e.message))
await context.route("**/api/**", async route => {
  const request = route.request()
  const url = new URL(request.url()).pathname
  assert.equal(request.method(), "POST")
  const body = request.postDataJSON()
  assert.equal(body.accountSid, environment.accountSid)
  assert.equal(body.authToken, environment.authToken)
  requests.push({ url, body })
  if (delay) await new Promise(resolve => setTimeout(resolve, delay))
  if (mode === "error") return route.fulfill({ status: 403, json: { error: "Sem permissão para esta operação." } })
  const empty = mode === "empty"
  const json = {
    "/api/environments/verify": { ok: true },
    "/api/conversations/fetch": { conversation, participants: [] },
    "/api/conversations/history": { conversation, messages: empty ? [] : [
      { sid: sid("IM"), author: "Atendimento", body: "Mensagem de teste para consulta e exportação", dateCreated: date, dateUpdated: date, media: [], participantSid: null },
      { sid: "IM" + "2".repeat(32), author: "Cliente", body: "Segundo conteúdo", dateCreated: date, dateUpdated: date, media: [{ filename: "documento.pdf", contentType: "application/pdf", size: 1024, sid: sid("ME") }], participantSid: null },
    ], hasMore: true },
    "/api/conversations/fetch-by-participant": { conversations: empty ? [] : [{ conversationSid: body.pageToken ? "CH" + "2".repeat(32) : CH, conversationFriendlyName: conversation.friendlyName, conversationState: "active", conversationDateCreated: date, conversationDateUpdated: date }], nextPageToken: body.pageToken || empty ? null : "page-2" },
    "/api/taskrouter/fetch-task": { task },
    "/api/taskrouter/search-tasks": { tasks: empty ? [] : [task], phone: body.phoneNumber },
    "/api/taskrouter/fetch-worker": { worker },
    "/api/numbers/list": { numbers: empty ? [] : [{ id: sid("IG"), friendlyName: "Marca com nome extenso para testar a apresentação dos resultados", phoneNumber: "+5511999999999", service: "Conversations" }, { id: "IG" + "2".repeat(32), friendlyName: "Outra marca", phoneNumber: "+5511888888888", service: "Programmable Chat" }] },
    "/api/flex/create-address-config": { sid: sid("IG"), address: body.address, type: body.type, friendlyName: body.friendlyName, autoCreation: { enabled: true, type: body.autoCreationType }, dateCreated: date, dateUpdated: date, country: null },
  }[url]
  if (json) return route.fulfill({ json })
  const finals = {
    "/api/conversations/close": { totalClosed: 2, totalErrors: 0 },
    "/api/taskrouter/assign-workers": { totalUpdated: 1, totalSkipped: 0, totalErrors: 0 },
    "/api/taskrouter/cancel-queue-tasks": { totalSuccess: 1, totalSkipped: 0, totalErrors: 0 },
    "/api/taskrouter/create-workflow": { workflowSid: sid("WW"), workflowName: body.workflowName, totalFilters: 1 },
    "/api/taskrouter/add-particular-filter": { totalAdded: 1, totalSkipped: 0, totalErrors: 0 },
    "/api/taskrouter/update-worker-feature": { totalUpdated: 1, totalErrors: 0 },
  }[url]
  assert.ok(finals, `Unexpected API ${url}`)
  return route.fulfill({ contentType: "text/event-stream", body: [
    { level: "info", message: "Operação em andamento", progress: { current: 1, total: 1 } },
    { level: "success", message: "Operação concluída", done: true, ...finals },
  ].map(event => `data: ${JSON.stringify(event)}\n\n`).join("") })
})
fs.mkdirSync(".next/redesign", { recursive: true })
async function go(route) {
  await page.goto(base + route, { waitUntil: "networkidle" })
  await page.locator(".environment-trigger").filter({ hasText: environment.name }).waitFor()
}
async function verifyLayout(label) {
  assert.equal(await page.locator("main h1:visible").count(), 1, label)
  const state = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, duplicates: [...document.querySelectorAll("[id]")].map(n => n.id).filter((id, i, all) => all.indexOf(id) !== i) }))
  if (state.scroll > state.width + 1) console.log(await page.evaluate(() => [...document.querySelectorAll("main *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})).slice(0,10)))
  assert.ok(state.scroll <= state.width + 1, `${label}: overflow ${state.scroll}/${state.width}`)
  assert.deepEqual(state.duplicates, [], `${label}: duplicate IDs`)
}
async function confirmSubmit() {
  const count = requests.length
  await page.locator("main button[type=submit]:visible").click()
  const modal = page.getByRole("alertdialog")
  await modal.waitFor()
  assert.equal(requests.length, count, "No API before confirmation")
  await modal.locator('[data-slot="alert-dialog-action"]').click()
  await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'))
  await page.waitForTimeout(100)
}
try {
  const routes = ["/", "/conversations", "/conversations/consult", "/conversations/fetch-by-participant", "/conversations/close", "/taskrouter", "/taskrouter/workers", "/taskrouter/search-tasks", "/taskrouter/fetch-task", "/taskrouter/create-workflow", "/taskrouter/add-particular-filter", "/taskrouter/cancel-queue-tasks", "/numbers", "/numbers/list", "/flex", "/flex/create-address-config", "/settings", "/settings/environments", "/settings/contacts", "/settings/variables"]
  for (const width of process.env.SWITCHBOARD_TEST_FLOWS_ONLY ? [] : [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const route of routes) { await go(route); await verifyLayout(`${width}:${route}`) }
    console.log(`Layout aprovado: ${width}px, ${routes.length} páginas`)
  }
  await page.setViewportSize({ width: 375, height: 812 })
  await go("/")
  const trigger = page.getByRole("button", { name: strings.sidebar.toggleLabel })
  await trigger.click()
  await page.getByRole("dialog").waitFor()
  for (let i = 0; i < 30; i++) { await page.keyboard.press("Tab"); assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))), "Menu focus containment") }
  await page.keyboard.press("Escape")
  await page.getByRole("dialog").waitFor({ state: "hidden" })
  assert.ok(await trigger.evaluate(el => el === document.activeElement), "Menu restores trigger focus")
  await page.screenshot({ path: ".next/redesign/home-mobile.png", fullPage: true })
  console.log("Menu mobile: foco, Escape e retorno aprovados")

  await page.setViewportSize({ width: 1440, height: 1000 })
  await go(`/conversations/consult?sid=${CH}&tab=messages`)
  await page.locator("#message-content-search").waitFor()
  // Dev Strict Mode can start and abort one initial request before remounting.
  const historyLoads = requests.filter(r => r.url === "/api/conversations/history").length
  assert.ok(historyLoads >= 1 && historyLoads <= 2)
  await page.locator("#message-content-search").fill("Segundo")
  assert.equal(await page.locator("main ol > li").count(), 1)
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: strings.conversations.history.export.button }).click()
  const download = await downloadPromise
  const csv = fs.readFileSync(await download.path(), "utf8")
  assert.ok(csv.includes("Segundo conteúdo") && !csv.includes("Mensagem de teste"))
  await page.getByRole("tab", { name: strings.conversations.consult.details, exact: true }).click()
  await page.getByRole("tab", { name: strings.conversations.consult.messages, exact: true }).click()
  assert.equal(await page.locator("#message-content-search").inputValue(), "Segundo")
  assert.equal(requests.filter(r => r.url === "/api/conversations/history").length, historyLoads, "Cached tab does not refetch messages")
  await verifyLayout("Conversation messages")
  await page.screenshot({ path: ".next/redesign/conversation-desktop.png", fullPage: true })

  await go("/conversations/fetch-by-participant")
  await page.locator("#phone").fill("11999999999")
  await confirmSubmit()
  const more = page.locator('main button').filter({ hasText: strings.conversations.fetchByParticipant.results.loadMore })
  if (await more.count()) { await more.click(); await page.waitForTimeout(200); assert.ok(requests.some(r => r.body.pageToken === "page-2")) }
  console.log("Conversations: deep link, lazy tab, filtros, CSV e paginação aprovados")

  await go("/taskrouter/workers")
  await page.locator("#worker-management-workspace").fill(WS)
  await page.locator('main form input:visible').fill(WK)
  await confirmSubmit()
  await page.getByRole("button", { name: strings.taskrouter.workerManagement.actions.addSkill, exact: true }).click()
  await page.locator("#skill").fill("suporte")
  await confirmSubmit()
  assert.ok(requests.some(r => r.url.endsWith("assign-workers") && r.body.emails[0] === WK))
  await page.getByRole("tab", { name: strings.taskrouter.workerManagement.tabs.features, exact: true }).click()
  await page.locator("#feature-name").fill("plugin")
  const enabled = page.locator("main select:visible")
  await enabled.selectOption("false")
  await confirmSubmit()
  assert.equal(requests.findLast(r => r.url.endsWith("update-worker-feature")).body.enabled, false)
  await verifyLayout("Worker feature result")
  console.log("Workers: prefill, skills, false e contrato de lote aprovados")

  for (const route of ["/conversations/close", "/taskrouter/cancel-queue-tasks", "/taskrouter/create-workflow", "/taskrouter/add-particular-filter"]) {
    await go(route)
    if (route.endsWith("close")) await page.locator("#close-phone-0").fill("11999999999")
    else {
      await page.locator("#workspaceSid").fill(WS)
      if (route.endsWith("cancel-queue-tasks")) await page.locator("#taskQueueName").fill("Suporte")
      if (route.endsWith("create-workflow")) {
        await page.locator("#workflowName").fill("Workflow de teste")
        await page.locator("#csvFile").setInputFiles({ name: "regras.csv", mimeType: "text/csv", buffer: Buffer.from("Regra de Negócio;Fila Twilio\nSuporte;Suporte") })
      }
      if (route.endsWith("add-particular-filter")) {
        await page.locator("#filterName").fill("Suporte")
        await page.locator("#filter-workflow-0").fill(sid("WW"))
        await page.locator("#filter-queue-0").fill(sid("WQ"))
      }
    }
    const count = requests.length
    await page.locator('main button[type="submit"]:visible').click()
    await page.getByRole("alertdialog").locator('[data-slot="alert-dialog-cancel"]').click()
    assert.equal(requests.length, count, "Cancel confirmation never mutates")
    await confirmSubmit()
    await page.getByRole("log").waitFor()
    assert.ok((await page.getByRole("log").textContent()).includes("Operação concluída"))
    await verifyLayout(route + " result")
    console.log("SSE e confirmação aprovados: " + route)
  }
  await go("/numbers/list")
  await page.locator("main > div button").filter({ hasText: strings.numbers.list.submit }).first().click()
  await page.getByRole("alertdialog").locator('[data-slot="alert-dialog-action"]').click()
  await page.locator("tbody tr").first().waitFor()
  await page.getByRole("searchbox", { name: strings.numbers.list.table.searchLabel }).fill("Outra")
  assert.equal(await page.locator("tbody tr").count(), 1)
  await page.getByRole("button", { name: strings.numbers.list.table.export, exact: true }).click()
  const csvDownload = page.waitForEvent("download")
  await page.getByRole("menuitem", { name: strings.numbers.list.table.exportCsv, exact: true }).click()
  assert.ok(fs.readFileSync(await (await csvDownload).path(), "utf8").includes("Marca com nome extenso"))
  await page.setViewportSize({ width: 375, height: 812 })
  await verifyLayout("Numbers results mobile")
  await page.screenshot({ path: ".next/redesign/numbers-mobile.png", fullPage: true })
  console.log("Numbers: filtro e exportação total preservados")

  await go("/flex/create-address-config")
  await page.locator("#address").fill("whatsapp:+5511999999999")
  await page.locator("#integrationType").selectOption("default")
  await confirmSubmit()
  assert.equal(requests.findLast(r => r.url.endsWith("create-address-config")).body.autoCreationEnabled, true)
  await verifyLayout("Flex result mobile")

  mode = "error"
  await go("/numbers/list")
  await page.locator("main button").filter({ hasText: strings.numbers.list.submit }).first().click()
  await page.getByRole("alertdialog").locator('[data-slot="alert-dialog-action"]').click()
  await page.locator("main").getByRole("alert").waitFor()
  mode = "empty"
  await go("/numbers/list")
  await page.locator("main button").filter({ hasText: strings.numbers.list.submit }).first().click()
  await page.getByRole("alertdialog").locator('[data-slot="alert-dialog-action"]').click()
  await page.getByText(strings.numbers.list.table.empty, { exact: true }).waitFor()
  mode = "success"

  for (const [route,target] of [[`/conversations/fetch?sid=${CH}`,"/conversations/consult"],[`/conversations/history?sid=${CH}`,"/conversations/consult"],["/taskrouter/fetch-worker","/taskrouter/workers"],["/taskrouter/assign-workers","/taskrouter/workers"],["/taskrouter/update-worker-feature","/taskrouter/workers"]]) { await go(route); assert.equal(new URL(page.url()).pathname,target) }
  await page.emulateMedia({ colorScheme: "dark" })
  await page.getByRole("button", { name: strings.interface.theme }).click()
  await page.getByRole("menuitem", { name: strings.interface.dark, exact: true }).click()
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"))
  await verifyLayout("Dark theme")
  await page.screenshot({ path: ".next/redesign/worker-dark-mobile.png", fullPage: true })
  assert.deepEqual(failures, [], "No browser runtime errors")
  console.log("Redesign browser suite approved: routes, responsiveness, keyboard, mocked contracts and downloads")
} finally { await browser.close() }
