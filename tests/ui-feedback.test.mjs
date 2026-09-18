import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import test from "node:test"
import ts from "typescript"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createLoader } from "./typescript-loader.mjs"

const require = createRequire(import.meta.url)
const { strings } = createLoader()("lib/strings.ts")
const noop = () => {}
const environment = { id: "test", name: "Teste", accountSid: "", authToken: "" }
const tools = [
  ["conversations/close", "CloseForm"],
  ["conversations/conversation", "ConversationForm"],
  ["conversations/fetch-by-participant", "FetchByParticipantForm"],
  ["flex/create-address-config", "CreateAddressConfigForm"],
  ["numbers/list-numbers", "ListNumbersForm"],
  ["taskrouter/add-particular-filter", "AddParticularFilterForm"],
  ["taskrouter/assign-workers", "AssignWorkersForm"],
  ["taskrouter/cancel-queue-tasks", "CancelQueueTasksForm"],
  ["taskrouter/create-workflow", "CreateWorkflowForm"],
  ["taskrouter/fetch-worker", "FetchWorkerForm"],
  ["taskrouter/search-tasks", "SearchTasksForm"],
  ["taskrouter/update-worker-feature", "UpdateWorkerFeatureForm"],
  ["variables/variables-manager", "VariablesManager"],
].map(([entry, name]) => {
  const [domain, component] = entry.split("/")
  return [`features/${domain}/components/${component}${/manager/.test(component) ? "" : "-form"}.tsx`, name]
})

// SSR seeds hook initializers in memory; effects, requests and handlers do not run.
function render(file, name, { activeEnvironment = environment, states = {}, props = {} } = {}) {
  const cache = new Map()
  const mocks = {
    "next/link": { __esModule: true, default: ({ children, href, ...rest }) =>
      React.createElement("a", { ...rest, href: typeof href === "string" ? href : href.pathname }, children) },
    "next/navigation": { useRouter: () => ({ push: noop }), useSearchParams: () => new URLSearchParams() },
    "next/dynamic": { __esModule: true, default: () => () => null },
    "@/features/environments/context": { useEnvironment: () => ({ activeEnvironment }) },
  }
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative)
    let source = readFileSync(relative, "utf8")
    const seeds = states[relative] ?? {}
    const ast = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const edits = []
    function visit(node) {
      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) &&
          node.initializer && ts.isCallExpression(node.initializer)) {
        const key = node.name.elements[0]?.name?.getText(ast)
        if (Object.hasOwn(seeds, key)) {
          const argument = node.initializer.arguments[0]
          const value = JSON.stringify(seeds[key]).replace(/"timestamp":"([^"]+)"/g, '"timestamp":new Date("$1")')
          edits.push([argument.getStart(ast), argument.end, value])
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
    for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
      source = source.slice(0, start) + value + source.slice(end)
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText
    const loadedModule = { exports: {} }
    cache.set(relative, loadedModule.exports)
    const localRequire = id => {
      if (Object.hasOwn(mocks, id)) return mocks[id]
      if (id.startsWith("@/") || id.startsWith(".")) {
        const stem = id.startsWith("@/") ? id.slice(2) : path.posix.join(path.posix.dirname(relative), id)
        return load([`${stem}.ts`, `${stem}.tsx`].find(existsSync))
      }
      return require(id)
    }
    new Function("require", "module", "exports", code)(localRequire, loadedModule, loadedModule.exports)
    return loadedModule.exports
  }
  return renderToStaticMarkup(React.createElement(load(file)[name], props))
}

function inspectReferences(html) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(new Set(ids).size, ids.length, "IDs must be unique")
  for (const match of html.matchAll(/(?:aria-describedby|aria-labelledby|\bfor)="([^"]+)"/g))
    for (const reference of match[1].split(/\s+/)) assert.ok(ids.includes(reference), reference)
}

test("all 13 missing-environment consumers expose one nonurgent contextual status", () => {
  for (const [file, name] of tools) {
    const html = render(file, name, { activeEnvironment: null })
    assert.equal(html.split(strings.common.noEnvironmentSelected.title).length - 1, 1, file)
    assert.equal(html.split(strings.common.noEnvironmentSelected.message).length - 1, 1, file)
    assert.match(html, /role="status"/)
    assert.doesNotMatch(html, /role="alert"/)
    assert.match(html, /href="\/settings\/environments"/)
    inspectReferences(html)
    assert.ok(!render(file, name).includes(strings.common.noEnvironmentSelected.title), file)
  }
})

test("operation errors remain inline alerts with escaped messages", () => {
  for (const [file, name] of tools.filter(([file]) => /fetch-by-participant|create-address-config|list-numbers|fetch-worker|search-tasks/.test(file))) {
    const html = render(file, name, { states: { [file]: { error: "Falha <interna>" } } })
    assert.match(html, /role="alert"[^>]*>Falha &lt;interna&gt;<\/div>/)
    inspectReferences(html)
  }
})

test("field errors retain their accessible descriptions and invalid flags", () => {
  const file = "features/environments/components/environment-form.tsx"
  const html = render(file, "EnvironmentForm", {
    states: { [file]: { errors: { name: "Nome obrigatório", accountSid: "SID inválido", authToken: "Token inválido" } } },
    props: { onSave: noop, onCancel: noop },
  })
  assert.equal((html.match(/aria-invalid="true"/g) ?? []).length, 3)
  for (const field of ["name", "sid", "token"]) assert.ok(html.includes(`env-${field}-error`))
  inspectReferences(html)
})

test("short-action loading is named and decorative spinners stay hidden", () => {
  for (const [file, name] of tools.filter(([file]) => /list-numbers|search-tasks/.test(file))) {
    const html = render(file, name, { states: { [file]: { loading: true } } })
    assert.match(html, /role="status"/)
    assert.ok(html.includes(strings.common.processing))
    assert.match(html, /lucide-loader[^>]*aria-hidden="true"/)
  }
  const [file, name] = tools.find(([file]) => file.includes("create-address-config"))
  assert.match(render(file, name, { states: { [file]: { loading: true } } }), /aria-busy="true"/)
})

test("credential verification distinguishes existing success from failure", () => {
  const file = "features/environments/components/environment-form.tsx"
  const props = { onSave: noop, onCancel: noop }
  const success = render(file, "EnvironmentForm", { props, states: { [file]: { testState: "success" } } })
  assert.match(success, /role="status"/)
  assert.ok(success.includes(strings.environments.form.testSuccess))
  assert.doesNotMatch(success, /role="alert"/)
  const failure = render(file, "EnvironmentForm", { props, states: { [file]: { testState: "error", testError: "Falha na verificação" } } })
  assert.match(failure, /role="alert"/)
  assert.ok(failure.includes("Falha na verificação"))
  assert.ok(!failure.includes(strings.environments.form.testSuccess))
})

test("initial skeleton announces loading once and hides decorative content", () => {
  const html = render("components/page-loading.tsx", "PageLoading")
  assert.equal((html.match(/role="status"/g) ?? []).length, 1)
  assert.ok(html.includes(strings.common.loadingPage))
  assert.match(html, /aria-hidden="true" class="motion-safe:animate-pulse"/)
})

test("batch progress retains event counts and the existing percentage", () => {
  for (const [file, name] of tools.filter(([file]) => /close-form|assign-workers|cancel-queue-tasks/.test(file))) {
    const html = render(file, name, { states: { [file]: { status: "running", progress: { current: 2, total: 4 } } } })
    assert.match(html, /role="progressbar"[^>]*aria-valuemin="0" aria-valuenow="2" aria-valuemax="4"/)
    assert.match(html, /width:50%/)
    assert.ok(html.includes("50%"))
    assert.ok(html.includes(strings.common.operationProgress))
    inspectReferences(html)
  }
})

test("partial batch results keep successful, skipped and failed counts together", () => {
  const summary = { totalClosed: 2, totalUpdated: 2, totalSuccess: 2, totalAdded: 2, totalSkipped: 3, totalErrors: 1 }
  for (const [file, name] of tools.filter(([file]) => /close-form|assign-workers|cancel-queue-tasks|add-particular-filter/.test(file))) {
    const html = render(file, name, { states: { [file]: { status: "done", summary } } })
    assert.match(html, /class="font-medium text-destructive">1 erro/)
    assert.match(html, /text-emerald-600 dark:text-emerald-400">2 /)
    assert.doesNotMatch(html, /role="alert"/)
    if (!file.includes("close-form")) assert.match(html, /text-muted-foreground">3 /)
  }
})

test("all six SSE consumers expose one named log without changing message order", () => {
  const logs = ["Primeiro", "Segundo"].map((message, index) => ({
    id: String(index), level: index ? "warning" : "success", message, timestamp: "2026-01-01T00:00:00Z",
  }))
  for (const [file, name] of tools.filter(([file]) => /close-form|assign-workers|cancel-queue-tasks|create-workflow|add-particular-filter|update-worker-feature/.test(file))) {
    // Dates are reconstructed in the seed, since JSON does not retain Date methods.
    const states = { [file.includes("update-worker-feature") ? file.replace("update-worker-feature-form.tsx", "use-update-worker-feature.ts") : file]: { logs } }
    const html = render(file, name, { states })
    assert.equal((html.match(/role="log"/g) ?? []).length, 1, file)
    assert.match(html, /role="log" aria-label="Log de operações" aria-live="polite" aria-atomic="false"/)
    assert.ok(html.indexOf("Primeiro") < html.indexOf("Segundo"))
  }
})

test("valid empty results and filtered emptiness remain distinct from failures", () => {
  const file = "features/conversations/components/conversation-messages.tsx"
  const props = { participants: [], data: { messages: [], hasMore: false, conversation: { sid: "test" } } }
  let html = render(file, "ConversationMessages", { props })
  assert.ok(html.includes(strings.conversations.history.result.empty))
  assert.doesNotMatch(html, /role="alert"/)
  props.data.messages = [{ sid: "message", author: "Agente", body: "Olá", dateCreated: null }]
  html = render(file, "ConversationMessages", { props, states: {
    "features/conversations/components/use-message-filters.ts": { contentQuery: "ausente" },
  } })
  assert.ok(html.includes(strings.conversations.history.result.noFilteredMessages))
  assert.ok(!html.includes(strings.conversations.history.result.empty))
  assert.doesNotMatch(html, /role="alert"/)
})

test("message truncation remains a nonblocking warning", () => {
  const html = render("features/conversations/components/conversation-messages.tsx", "ConversationMessages", {
    props: { participants: [], data: { messages: [], hasMore: true, conversation: { sid: "test" } } },
  })
  assert.ok(html.includes(strings.conversations.history.result.limitWarning))
  assert.match(html, /bg-amber-500\/10/)
  assert.doesNotMatch(html, /role="alert"/)
})

test("phone examples and hints match the existing digits-only format without removing the ninth digit", () => {
  for (const [file, name] of tools.filter(([file]) => /close-form|fetch-by-participant/.test(file))) {
    const html = render(file, name)
    assert.match(html, /placeholder="11999999999"/)
    assert.ok(html.includes("DDD + número, apenas dígitos, sem +55"))
    assert.ok(!html.includes("sem dígito 9"))
  }
})
