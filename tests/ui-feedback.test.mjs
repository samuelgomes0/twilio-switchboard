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
  ["numbers/list-numbers", "ListNumbersForm"],
  ["taskrouter/assign-workers", "AssignWorkersForm"],
  ["taskrouter/fetch-worker", "FetchWorkerForm"],
  ["taskrouter/search-tasks", "SearchTasksForm"],
  ["taskrouter/update-worker-feature", "UpdateWorkerFeatureForm"],
  ["variables/variables-manager", "VariablesManager"],
].map(([entry, name]) => {
  const [domain, component] = entry.split("/")
  return [
    `features/${domain}/components/${component}${/manager/.test(component) ? "" : "-form"}.tsx`,
    name,
  ]
})

// SSR seeds hook initializers in memory; effects, requests and handlers do not run.
function render(
  file,
  name,
  { activeEnvironment = environment, states = {}, props = {} } = {}
) {
  const cache = new Map()
  const mocks = {
    "next/link": {
      __esModule: true,
      default: ({ children, href, ...rest }) =>
        React.createElement(
          "a",
          { ...rest, href: typeof href === "string" ? href : href.pathname },
          children
        ),
    },
    "next/navigation": {
      usePathname: () => "/",
      useRouter: () => ({ push: noop }),
      useSearchParams: () => new URLSearchParams(),
    },
    "next/dynamic": { __esModule: true, default: () => () => null },
    "@/features/environments/context": {
      useEnvironment: () => ({
        activeEnvironment,
        environments: activeEnvironment ? [activeEnvironment] : [],
      }),
    },
  }
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative)
    let source = readFileSync(relative, "utf8")
    const seeds = states[relative] ?? {}
    const ast = ts.createSourceFile(
      relative,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    )
    const edits = []
    function visit(node) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isArrayBindingPattern(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer)
      ) {
        const key = node.name.elements[0]?.name?.getText(ast)
        if (Object.hasOwn(seeds, key)) {
          const argument =
            node.initializer.arguments[
              node.initializer.expression.getText(ast) === "useBrowserState"
                ? 1
                : 0
            ]
          const value = JSON.stringify(seeds[key]).replace(
            /"timestamp":"([^"]+)"/g,
            '"timestamp":new Date("$1")'
          )
          if (argument)
            edits.push([argument.getStart(ast), argument.end, value])
          else
            edits.push([
              node.initializer.getStart(ast),
              node.initializer.end,
              `${node.initializer.expression.getText(ast)}(${value})`,
            ])
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
    for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0]))
      source = source.slice(0, start) + value + source.slice(end)
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText
    const loadedModule = { exports: {} }
    cache.set(relative, loadedModule.exports)
    const localRequire = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id]
      if (id.startsWith("@/") || id.startsWith(".")) {
        const stem = id.startsWith("@/")
          ? id.slice(2)
          : path.posix.join(path.posix.dirname(relative), id)
        return load([`${stem}.ts`, `${stem}.tsx`].find(existsSync))
      }
      return require(id)
    }
    new Function("require", "module", "exports", code)(
      localRequire,
      loadedModule,
      loadedModule.exports
    )
    return loadedModule.exports
  }
  return renderToStaticMarkup(React.createElement(load(file)[name], props))
}

function inspectReferences(html) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(ids).size, ids.length, "IDs must be unique")
  for (const match of html.matchAll(
    /(?:aria-describedby|aria-labelledby|\bfor)="([^"]+)"/g
  ))
    for (const reference of match[1].split(/\s+/))
      assert.ok(ids.includes(reference), reference)
}

test("all missing-environment consumers expose one nonurgent contextual status", () => {
  for (const [file, name] of tools) {
    const html = render(file, name, { activeEnvironment: null })
    assert.equal(
      html.split(strings.common.noEnvironmentSelected.title).length - 1,
      1,
      file
    )
    assert.equal(
      html.split(strings.common.noEnvironmentSelected.message).length - 1,
      1,
      file
    )
    assert.match(html, /role="status"/)
    assert.doesNotMatch(html, /role="alert"/)
    assert.match(html, /href="\/settings\/manage-environments"/)
    inspectReferences(html)
    assert.ok(
      !render(file, name).includes(strings.common.noEnvironmentSelected.title),
      file
    )
  }
})

test("operation errors remain inline alerts with escaped messages", () => {
  for (const [file, name] of tools.filter(([file]) =>
    /fetch-by-participant|create-address-config|list-numbers|fetch-worker|search-tasks/.test(
      file
    )
  )) {
    const stateFile = /fetch-by-participant/.test(file)
      ? "features/conversations/components/use-participant-search.ts"
      : file
    const html = render(file, name, {
      states: { [stateFile]: { error: "Falha <interna>" } },
    })
    assert.match(html, /role="alert"[^>]*>Falha &lt;interna&gt;<\/div>/)
    inspectReferences(html)
  }
})

test("participant search shows progress with enabled cancellation and all loaded active matches", () => {
  const file = "features/conversations/components/fetch-by-participant-form.tsx"
  const hook = "features/conversations/components/use-participant-search.ts"
  const results = Array.from({ length: 25 }, (_, index) => ({
    conversationSid: `CH${index}`,
    conversationState: "active",
  }))
  const html = render(file, "FetchByParticipantForm", {
    states: { [hook]: { loading: true, pages: 2, results } },
  })
  assert.ok(
    html.includes(strings.conversations.fetchByParticipant.progress(2, 25))
  )
  assert.equal((html.match(/role="status"/g) ?? []).length, 1)
  assert.equal((html.match(/Consultar Conversation/g) ?? []).length, 25)
  assert.doesNotMatch(html, /Exibir mais/)
  const cancelButton = html.match(/<button\b[^>]*>Cancelar<\/button>/)?.[0]
  assert.ok(cancelButton)
  assert.doesNotMatch(cancelButton, /\sdisabled(?:=|\s|>)/)
  inspectReferences(html)
})

test("field errors retain their accessible descriptions and invalid flags", () => {
  const file = "features/environments/components/environment-form.tsx"
  const html = render(file, "EnvironmentForm", {
    states: {
      [file]: {
        errors: {
          name: "Nome obrigatório",
          accountSid: "SID inválido",
          authToken: "Token inválido",
        },
      },
    },
    props: { onSave: noop, onCancel: noop },
  })
  assert.equal((html.match(/aria-invalid="true"/g) ?? []).length, 3)
  for (const field of ["name", "sid", "token"])
    assert.ok(html.includes(`env-${field}-error`))
  inspectReferences(html)
})

test("single-conversation close action appears only for active list items and active details", () => {
  const sid = "CH" + "1".repeat(32)
  for (const state of ["active", "inactive", "closed", "unknown"]) {
    const list = render(
      "features/conversations/components/fetch-by-participant-form.tsx",
      "FetchByParticipantForm",
      {
        states: {
          "features/conversations/components/use-participant-search.ts": {
            results: [{ conversationSid: sid, conversationState: state }],
          },
        },
      }
    )
    const details = render(
      "features/conversations/components/conversation-details.tsx",
      "ConversationDetails",
      {
        props: {
          conversation: { sid, state, attributes: "{}" },
          onRefresh: noop,
          onUpdated: noop,
        },
      }
    )
    for (const html of [list, details]) {
      assert.equal(
        html.includes(strings.conversations.closeSingle.ariaLabel(sid)),
        state === "active"
      )
      inspectReferences(html)
    }
  }
})

test("short-action loading is named and decorative spinners stay hidden", () => {
  for (const [file, name] of tools.filter(([file]) =>
    /list-numbers|search-tasks/.test(file)
  )) {
    const html = render(file, name, { states: { [file]: { loading: true } } })
    assert.match(html, /role="status"/)
    assert.ok(html.includes(strings.common.processing))
    assert.match(html, /lucide-loader[^>]*aria-hidden="true"/)
  }
})

test("credential verification distinguishes existing success from failure", () => {
  const file = "features/environments/components/environment-form.tsx"
  const props = { onSave: noop, onCancel: noop }
  const success = render(file, "EnvironmentForm", {
    props,
    states: { [file]: { testState: "success" } },
  })
  assert.match(success, /role="status"/)
  assert.ok(success.includes(strings.environments.form.testSuccess))
  assert.doesNotMatch(success, /role="alert"/)
  const failure = render(file, "EnvironmentForm", {
    props,
    states: {
      [file]: { testState: "error", testError: "Falha na verificação" },
    },
  })
  assert.match(failure, /role="alert"/)
  assert.ok(failure.includes("Falha na verificação"))
  assert.ok(!failure.includes(strings.environments.form.testSuccess))
})

test("credential verification aborts stale requests when form values change", () => {
  const source = readFileSync(
    "features/environments/components/environment-form.tsx",
    "utf8"
  )
  assert.match(source, /testAbortRef\.current\?\.abort\(\)/)
  assert.match(source, /signal: controller\.signal/)
  assert.match(source, /testAbortRef\.current !== controller/)
})

test("initial skeleton announces loading once and hides decorative content", () => {
  const html = render("components/page-loading.tsx", "PageLoading")
  assert.equal((html.match(/role="status"/g) ?? []).length, 1)
  assert.ok(html.includes(strings.common.loadingPage))
  assert.match(html, /aria-hidden="true" class="motion-safe:animate-pulse"/)
})

test("valid empty results and filtered emptiness remain distinct from failures", () => {
  const file = "features/conversations/components/conversation-messages.tsx"
  const props = {
    participants: [],
    data: { messages: [], hasMore: false, conversation: { sid: "test" } },
  }
  let html = render(file, "ConversationMessages", { props })
  assert.ok(html.includes(strings.conversations.history.result.empty))
  assert.doesNotMatch(html, /role="alert"/)
  props.data.messages = [
    { sid: "message", author: "Agente", body: "Olá", dateCreated: null },
  ]
  html = render(file, "ConversationMessages", {
    props,
    states: {
      "features/conversations/components/use-message-filters.ts": {
        contentQuery: "ausente",
      },
    },
  })
  assert.ok(
    html.includes(strings.conversations.history.result.noFilteredMessages)
  )
  inspectInputActions(html, ["export", "clear"])
  assert.ok(!html.includes(strings.conversations.history.result.empty))
  assert.doesNotMatch(html, /role="alert"/)
})

test("message truncation remains a nonblocking warning", () => {
  const html = render(
    "features/conversations/components/conversation-messages.tsx",
    "ConversationMessages",
    {
      props: {
        participants: [],
        data: { messages: [], hasMore: true, conversation: { sid: "test" } },
      },
    }
  )
  assert.ok(html.includes(strings.conversations.history.result.limitWarning))
  assert.match(html, /bg-warning-soft/)
  assert.doesNotMatch(html, /role="alert"/)
})

test("phone examples and hints match each form's accepted format without removing the ninth digit", () => {
  for (const [file, name] of tools.filter(([file]) =>
    /close-form|fetch-by-participant/.test(file)
  )) {
    const html = render(file, name)
    assert.match(html, /placeholder="11999999999"/)
    assert.ok(html.includes("DDD + número, apenas dígitos, sem +55"))
    assert.ok(html.includes("whatsapp:+55"))
    assert.ok(!html.includes("sem dígito 9"))
  }
})

test("search forms keep a separate action footer and submit semantics in both task modes", () => {
  for (const [file, name] of tools.filter(([file]) =>
    /conversation-form|fetch-by-participant|fetch-worker|search-tasks/.test(
      file
    )
  )) {
    for (const mode of ["sid", "phone"]) {
      const html = render(file, name, { states: { [file]: { mode } } })
      const form = html.match(/<form\b[^>]*>(.*?)<\/form>/s)?.[1]
      assert.ok(form, file)
      const search =
        form.match(/<button\b[^>]*data-action="search"[^>]*>/g) ?? []
      assert.equal(search.length, 1, file)
      assert.match(search[0], /type="submit"/)
      assert.match(search[0], /data-variant="default"/)
      assert.match(search[0], /data-size="default"/)
      const row = form
      assert.match(form, /data-form-actions="true"/)
      assert.ok(
        row.indexOf('data-action="search"') > row.indexOf("<input"),
        file
      )
      inspectReferences(html)
    }
  }
})

test("settings save and cancel share size and order in the footer", () => {
  for (const [file, name, options] of [
    [
      "features/contacts/components/contacts-manager.tsx",
      "ContactsManager",
      {
        states: {
          "features/contacts/components/contacts-manager.tsx": {
            showAddForm: true,
          },
        },
      },
    ],
    [
      "features/environments/components/environment-form.tsx",
      "EnvironmentForm",
      { props: { onSave: noop, onCancel: noop } },
    ],
  ]) {
    const html = render(file, name, options)
    const footer = html.slice(html.lastIndexOf('data-slot="action-bar"'))
    assert.ok(
      footer.indexOf('data-action="save"') <
        footer.indexOf('data-action="cancel"')
    )
    assert.match(
      footer,
      /<button(?=[^>]*data-action="save")(?=[^>]*data-variant="default")(?=[^>]*data-size="default")/
    )
    assert.match(
      footer,
      /<button(?=[^>]*data-action="cancel")(?=[^>]*data-variant="outline")(?=[^>]*data-size="default")/
    )
    assert.ok(!footer.includes("<input"))
    inspectInputActions(html, ["save", "cancel"])
    inspectReferences(html)
  }
})

test("number result actions precede the table and keep export available", () => {
  const file = "features/numbers/components/list-numbers-form.tsx"
  const html = render(file, "ListNumbersForm", {
    states: {
      [file]: {
        results: [
          {
            id: "sender",
            friendlyName: "Teste",
            phoneNumber: "11999999999",
            service: "Conversations",
          },
        ],
      },
    },
  })
  for (const action of ["refresh", "export"]) {
    assert.ok(html.indexOf(`data-action="${action}"`) < html.indexOf("<table"))
    assert.match(
      html,
      new RegExp(
        `<button(?=[^>]*data-action="${action}")(?=[^>]*data-variant="outline")(?=[^>]*data-size="default")`
      )
    )
  }
  assert.match(
    html,
    /<button(?=[^>]*data-action="export")(?=[^>]*aria-haspopup="menu")/
  )
  inspectInputActions(html, ["refresh", "export"])
})

function inspectInputActions(html, actions) {
  const ancestors = []
  const found = new Set()
  for (const match of html.matchAll(/<(\/?)([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const [, closing, tag, attributes] = match
    if (closing) {
      ancestors.pop()
      continue
    }
    const action = attributes.match(/data-action="([^"]+)"/)?.[1]
    if (tag === "button" && actions.includes(action)) {
      found.add(action)
      assert.ok(
        ancestors.some(
          (parent) =>
            parent.includes('data-slot="input-actions"') ||
            parent.includes('data-form-actions="true"') ||
            /^form\b/.test(parent)
        ),
        action
      )
      if (action === "stop") {
        assert.doesNotMatch(attributes, /\bdisabled=/)
        assert.ok(
          !ancestors.some((parent) => /^fieldset\b.*\bdisabled=/.test(parent))
        )
      }
    }
    if (
      !/^(input|br|hr|img|meta|link|area|base|col|embed|param|source|track|wbr)$/.test(
        tag
      ) &&
      !attributes.endsWith("/")
    ) {
      ancestors.push(`${tag} ${attributes}`)
    }
  }
  for (const action of actions) assert.ok(found.has(action), action)
}

test("variable add and edit actions stay beside their inputs", () => {
  const file = "features/variables/components/variables-manager.tsx"
  for (const showAdd of [true, false]) {
    const html = render(file, "VariablesManager", {
      states: {
        [file]: {
          state: {
            values: ["valor"],
            showAdd,
            addValue: "novo",
            editingIndex: showAdd ? null : 0,
            editValue: "valor",
            confirmDeleteIndex: null,
          },
        },
      },
    })
    inspectInputActions(html, ["save", "cancel"])
    inspectReferences(html)
  }
})

test("cross-tool context is prefilled only for its source environment", () => {
  const CH = `CH${"1".repeat(32)}`
  for (const [file, name, props, id, expected] of [
    [
      "features/conversations/components/conversation-form.tsx",
      "ConversationForm",
      { initialSid: CH },
      "conversation-sid",
      CH,
    ],
    [
      "features/taskrouter/components/search-tasks-form.tsx",
      "SearchTasksForm",
      { initialPhone: "whatsapp:+5511999999999" },
      "phone",
      "whatsapp:+5511999999999",
    ],
  ]) {
    let html = render(file, name, {
      props: { ...props, initialEnvironmentId: environment.id },
    })
    assert.match(
      html,
      new RegExp(
        `<input(?=[^>]*id="${id}")(?=[^>]*value="${expected.replaceAll("+", "\\+")}")`
      )
    )
    assert.ok(!html.includes(strings.common.contextEnvironmentMismatch))
    html = render(file, name, {
      props: { ...props, initialEnvironmentId: "other" },
    })
    assert.ok(html.includes(strings.common.contextEnvironmentMismatch))
    assert.ok(!html.includes(`value="${expected}"`))
    assert.match(html, /role="status"/)
    inspectReferences(html)
  }
})

test("first use explains environment setup", () => {
  const file = "features/environments/components/environments-manager.tsx"
  const html = render(file, "EnvironmentsManager", { activeEnvironment: null })
  assert.ok(html.includes(strings.environments.manager.emptyHint))
  for (const step of strings.environments.manager.setupSteps)
    assert.ok(html.includes(step))
  assert.ok(html.includes(strings.environments.manager.localCredentials))
})

test("number classification explains uncertainty next to results", () => {
  const file = "features/numbers/components/list-numbers-form.tsx"
  const html = render(file, "ListNumbersForm", {
    states: {
      [file]: {
        results: [
          {
            id: "sender",
            friendlyName: "Teste",
            phoneNumber: "11999999999",
            service: "Programmable Chat",
          },
        ],
      },
    },
  })
  assert.ok(html.includes(strings.numbers.list.classificationHint))
  assert.ok(html.includes("Programmable Chat (estimado)"))
})

test("directory supports category links and safely ignores unknown areas", () => {
  const file = "components/tool-directory.tsx"
  const html = render(file, "ToolDirectory", {
    props: { initialArea: "numbers" },
  })
  assert.ok(html.includes(strings.numbers.list.breadcrumb))
  assert.ok(!html.includes(strings.taskrouter.searchTasks.breadcrumb))
  const fallback = render(file, "ToolDirectory", {
    props: { initialArea: "unknown" },
  })
  assert.ok(fallback.includes(strings.numbers.list.breadcrumb))
  assert.ok(fallback.includes(strings.taskrouter.searchTasks.breadcrumb))
})

test("sidebar groups disclose tools and single-tool areas link directly", () => {
  const file = "components/sidebar-nav.tsx"
  const html = render(file, "SidebarNav")
  assert.match(html, /href="\/numbers\/list-messaging-numbers"/)
  assert.ok(
    html.includes(
      strings.interface.expandNavigation(strings.sidebar.sections.conversations)
    )
  )
  assert.ok(!html.includes('href="/?area=conversations"'))
  inspectReferences(html)
  const collapsed = render(file, "SidebarNav", { props: { collapsed: true } })
  assert.ok(collapsed.includes('href="/?area=conversations"'))
  assert.ok(collapsed.includes('href="/?area=taskrouter"'))
})

test("close form groups list editing before the separate submit footer", () => {
  const file = "features/conversations/components/close-form.tsx"
  const html = render(file, "CloseForm")
  assert.ok(!html.includes('data-action="remove"'))
  assert.ok(
    html.indexOf('data-action="add"') < html.indexOf('data-slot="action-bar"')
  )
  assert.ok(
    html.indexOf('data-slot="action-bar"') <
      html.indexOf('data-action="destructive"')
  )
  assert.match(html, /aria-describedby="close-phones-hint"/)
  inspectReferences(html)
  const multiple = render(file, "CloseForm", {
    states: { [file]: { phones: ["11999999999", "11888888888"] } },
  })
  assert.equal((multiple.match(/data-action="remove"/g) ?? []).length, 2)
  inspectReferences(multiple)
})

test("operational forms keep exactly one direct footer after every field", () => {
  const cases = [
    ...tools,
    [
      "features/environments/components/environment-form.tsx",
      "EnvironmentForm",
    ],
    ["features/contacts/components/contacts-manager.tsx", "ContactsManager"],
  ]
  for (const [file, name] of cases) {
    const options =
      name === "EnvironmentForm"
        ? { props: { onSave: noop, onCancel: noop } }
        : name === "ContactsManager"
          ? { states: { [file]: { showAddForm: true } } }
          : {}
    const html = render(file, name, options)
    for (const form of html.matchAll(
      /<form\b[^>]*data-slot="operation-form"[^>]*>(.*?)<\/form>/gs
    )) {
      const content = form[1]
      assert.equal(
        (content.match(/data-form-actions="true"/g) ?? []).length,
        1,
        file
      )
      const footer = content.indexOf('data-form-actions="true"')
      for (const field of content.matchAll(/<(?:input|select|textarea)\b/g))
        assert.ok(field.index < footer, `${file}: field after footer`)
      const stack = []
      for (const match of content.matchAll(
        /<(\/?)([a-z][a-z0-9-]*)\b([^>]*)>/gi
      )) {
        const [, close, tag, attrs] = match
        if (close) {
          stack.pop()
          continue
        }
        if (attrs.includes('data-form-actions="true"'))
          assert.equal(stack.length, 0, `${file}: nested footer`)
        if (
          !/^(input|br|hr|img|meta|link|area|base|col|embed|param|source|track|wbr)$/.test(
            tag
          ) &&
          !attrs.endsWith("/")
        )
          stack.push(tag)
      }
    }
  }
})
