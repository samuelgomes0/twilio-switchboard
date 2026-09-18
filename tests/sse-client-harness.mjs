import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import ts from "typescript"
import { createLoader } from "./typescript-loader.mjs"

export const clients = [
  ["close", "features/conversations/components/close-form.tsx"],
  ...["assign-workers", "cancel-queue-tasks", "create-workflow", "add-particular-filter"]
    .map(name => [name, `features/taskrouter/components/${name}-form.tsx`]),
  ["update-worker-feature", "features/taskrouter/components/use-update-worker-feature.ts"],
]

// Execute the real submit function without mounting UI or duplicating its parser.
export function clientHarness(name, options = {}) {
  const file = clients.find(([id]) => id === name)[1]
  const source = ts.createSourceFile(file, options.source ?? readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const functionName = name === "update-worker-feature" ? "run" : "runSubmit"
  let submit
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === functionName) submit = node
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(submit, `Missing ${functionName} in ${file}`)
  const state = { status: "idle", logs: [], history: [], summary: null, progress: null }
  const trace = []
  const abortRef = { current: null }
  const setter = key => value => {
    state[key] = typeof value === "function" ? value(state[key]) : value
    trace.push([key, state[key]])
  }
  const steps = [...(options.chunks ?? [])]
  let signal
  const reader = {
    async read() {
      trace.push(["read"])
      if (options.onRead) await options.onRead({ signal, abortRef, state })
      if (!steps.length) return { done: true }
      const value = steps.shift()
      if (value instanceof Error) throw value
      return { done: false, value: typeof value === "string" ? new TextEncoder().encode(value) : value }
    },
    cancel() { trace.push(["cancel"]) },
    releaseLock() { trace.push(["release"]) },
  }
  const load = createLoader()
  const dependencies = {}
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !node.moduleSpecifier.text.startsWith("@/lib/") || node.importClause?.isTypeOnly) continue
    const bindings = node.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    const exports = load(`${node.moduleSpecifier.text.slice(2)}.ts`)
    for (const binding of bindings.elements) {
      if (!binding.isTypeOnly) dependencies[binding.name.text] = exports[binding.propertyName?.text ?? binding.name.text]
    }
  }
  const context = {
    ...dependencies,
    canSubmit: true, activeEnvironment: {}, participants: ["11999999999"],
    workspaceSid: "workspace", skill: "skill", levelInput: "", emails: ["worker"],
    taskQueueName: "queue", closeMessage: "message", workflowName: "workflow",
    csvFile: { text: async () => "csv" }, filterName: "filter", pendingEntries: [{}],
    abortRef,
    reset() { trace.push(["reset"]) },
    setStatus: setter("status"), setLogs: setter("logs"), setHistory: setter("history"),
    setSummary: setter("summary"), setProgress: setter("progress"),
    addLog(level, message) {
      if (options.throwLog === message) throw new Error("callback failure")
      setter("logs")([...state.logs, { level, message }])
    },
    createLogEntry: (level, message) => {
      if (options.throwLog === message) throw new Error("callback failure")
      return { level, message }
    },
    pushHistory: (key, entry) => trace.push(["persist", key, entry]),
    Date: class extends Date { static now() { return 123 } },
    async fetch(url, init) {
      signal = init.signal
      trace.push(["fetch", url, init.method, init.body])
      if (options.fetchError) throw options.fetchError
      return {
        ok: options.ok ?? true,
        text: async () => options.httpBody ?? "",
        body: options.noBody ? null : { getReader() { trace.push(["reader"]); return reader } },
      }
    },
    HISTORY_KEY: `switchboard:${name}-history`,
  }
  const compiled = ts.transpileModule(submit.getText(source), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const run = new Function(...Object.keys(context), `${compiled}\nreturn ${functionName}`)(...Object.values(context))
  return { run, state, trace, abortRef }
}
