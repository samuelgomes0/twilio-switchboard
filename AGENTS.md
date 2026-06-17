# AGENTS.md

Mandatory guide for any AI agent operating in this repository.
Read this document **in full** before modifying any file.

---

## 1. Project Overview

**Switchboard** is an internal web dashboard for Twilio operations, aimed at support and operations teams that need to interact with the Twilio API without writing code. It provides visual interfaces for the Conversations API, TaskRouter API, Numbers API, and Flex.

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript — Strict Mode required |
| UI | React 19, Tailwind CSS, shadcn/ui, Lucide Icons |
| External API | Twilio SDK (`twilio` npm package) |
| Runtime | Node.js >= 22 |
| Storage | `localStorage` only (no database) |

### Principles

- **Clarity over abstraction**: readable code is preferable to "clever" code.
- **Single responsibility**: each module, component, and function does one thing.
- **Secure by default**: credentials never leave the browser; the server receives them via POST and discards them after the request.
- **UI language**: every user-visible string is in **pt-BR**.

---

## 2. General Rules

The rules below are **non-negotiable**. No exception is accepted without explicit justification in the PR.

- **TypeScript Strict Mode always on.** `tsconfig.json` already sets `"strict": true`; never change that.
- **No `any`.** Use precise types, `unknown` with type guards, or `ReturnType<typeof fn>`.
- **No dead code.** Unused variables, imports, functions, and code branches must be removed.
- **No commented-out code.** If code was removed, it was removed. Git history is the source of truth.
- **No unmarked temporary solutions.** If a short-term fix is needed, mark it with `// TODO(reason): description` and register it as technical debt.
- **Clarity over premature abstraction.** Three similar lines do not justify an abstraction. Only abstract when the pattern repeats three or more times and the abstraction does not obscure the intent.
- **Composition over inheritance.** React components, hooks, and utilities must be composed, not extended.
- **No logic duplication.** Before writing new logic, check whether it already exists in `lib/`, `features/<domain>/lib/`, or the shared components.

---

## 3. Architecture

### Directory structure

```
app/
  (pages)/          # Page components — Server Components that wrap form components
  api/              # Route Handlers — all Twilio API calls go through here
features/
  <domain>/
    components/     # Domain-specific forms and UI (Client Components)
    lib/            # Business logic called by Route Handlers
    types.ts        # Domain types
    tools.ts        # Nav item definitions for the domain landing page
components/         # Shared UI primitives and composed components
lib/                # Cross-cutting utilities
  constants.ts      # Global numeric constants
  contacts.ts       # Saved contacts
  stored-keys.ts    # localStorage autocomplete keys
  strings.ts        # ALL user-visible strings
  twilio-client.ts  # Twilio client factory
  utils.ts          # General utilities
  variables.ts      # Autocomplete management (readVariables, addVariable)
```

### Layer responsibilities

| Layer | Responsibility | Forbidden |
|---|---|---|
| `app/(pages)/` | Page wrapper; only imports the form component | Business logic, API calls |
| `app/api/` | Input validation, instantiate `getTwilioClient`, orchestrate lib calls, return Response | Business logic (delegate to `features/<domain>/lib/`) |
| `features/<domain>/lib/` | Business logic and Twilio calls | Reading `req`, manipulating Response, accessing `localStorage` |
| `features/<domain>/components/` | UI, local state, reading `localStorage`, calling `/api/` | Direct Twilio SDK calls |
| `lib/` | Reusable utilities across domains | Domain-specific dependencies |

### Navigation pattern

Each domain registers its navigation items in **two mandatory places**:

1. `components/sidebar-nav.tsx` — `NavItem[]` array used by the sidebar
2. `features/<domain>/tools.ts` — `Tool[]` array used by the domain landing page

The `available: boolean` field on `Tool` controls whether the item renders normally or as a "coming soon" card.

---

## 4. Code Conventions

### File naming

| Type | Convention | Example |
|---|---|---|
| React component | `kebab-case.tsx` | `close-form.tsx` |
| Route Handler | `route.ts` inside a semantic folder | `app/api/conversations/close/route.ts` |
| Lib / utility | `kebab-case.ts` | `twilio-client.ts` |
| Domain types | `types.ts` at the domain root | `features/conversations/types.ts` |
| Nav tools | `tools.ts` at the domain root | `features/taskrouter/tools.ts` |

### Symbol naming

```typescript
// React component — PascalCase
export function CloseForm() {}

// Hook — camelCase with "use" prefix
export function useEnvironment() {}

// Type / Interface — PascalCase
interface ConversationData {}
type Status = "idle" | "running" | "done" | "error"

// Module-level constant — UPPER_SNAKE_CASE
const HISTORY_KEY = "switchboard:close-history"

// Exported lib constant — UPPER_SNAKE_CASE
export const MAX_HISTORY = 5

// Utility function — camelCase
export function formatPhoneNumber(raw: string): string {}

// localStorage key — "switchboard:" prefix in kebab-case
"switchboard:workspace-sids"
```

**Incorrect examples:**
```typescript
// ❌ — name too generic
function handleClick() {}

// ❌ — any
function process(data: any) {}

// ❌ — comment describing what the code does
// Iterates over participants
for (const p of participants) {}
```

---

## 5. React Components

- **Single responsibility.** If a component does more than one logically distinct thing, split it.
- **Server Components by default.** Add `"use client"` only when the component needs state, effects, event handlers, or browser APIs (`localStorage`, `AbortController`).
- **Forms are Client Components.** All forms under `features/<domain>/components/` use `"use client"`.
- **Extract logic into hooks.** Reusable logic or more than ~30 lines of state/effects must go into a custom hook.
- **No prop drilling beyond 2 levels.** Use Context or composition.
- **Destructive operations require `WarningBadge`.** Any form that modifies Twilio data must render `<WarningBadge />`.
- **Cancellation is mandatory in SSE forms.** Forms that consume SSE must hold an `AbortController` in a ref and expose a cancel button.

### SSE form pattern

```typescript
"use client"

const abortRef = React.useRef<AbortController | null>(null)
const [status, setStatus] = React.useState<Status>("idle")
const [logs, setLogs] = React.useState<LogEntry[]>([])

async function handleSubmit() {
  abortRef.current = new AbortController()
  setStatus("running")

  const res = await fetch("/api/<domain>/<action>", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...fields, accountSid, authToken }),
    signal: abortRef.current.signal,
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split("\n")
    for (const line of lines) {
      if (!line.startsWith("data:")) continue
      const event = JSON.parse(line.slice(5).trim())
      setLogs((prev) => [...prev, createLogEntry(event.level, event.message)])
      if (event.done) setStatus("done")
    }
  }
}
```

---

## 6. Next.js

### Route Handlers (`app/api/`)

- Every route accepts `POST` only.
- The JSON body **always** includes `accountSid?: string` and `authToken?: string`, forwarded to `getTwilioClient()`.
- Validate the body in the Route Handler before instantiating the Twilio client.
- Return `400` for invalid input, `500` for credential errors or API failures.
- Long-running operation routes return `text/event-stream`. Include these headers:
  ```
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  X-Accel-Buffering: no
  ```
- Never log `accountSid` or `authToken` — not even in development.

### Metadata

- Every page must export `metadata` with `title` and `description` in pt-BR.

### Client Components

- Use `"use client"` only at the lowest necessary level.
- Never mark a page (`app/(pages)/.../page.tsx`) as a Client Component; the page wrapper is a Server Component that imports the form.

### Dynamic Routes

- Route parameters must be validated before any operation.

---

## 7. Strings and i18n

**Every user-visible string lives in `lib/strings.ts`.**

- Never inline strings in components.
- Always reference `strings.<domain>.<key>`.
- When adding a feature, add the corresponding strings to `strings.ts` **in the same PR**.
- The UI is in **pt-BR**. Do not introduce English strings in the user interface.

```typescript
// ✅
<p>{strings.common.processing}</p>

// ❌
<p>Processando...</p>
```

---

## 8. Credentials and Environments

- Twilio credentials (`accountSid`, `authToken`) are stored **only in the browser's `localStorage`**.
- The server never persists credentials — they arrive via POST body and are discarded after the request.
- `getTwilioClient(accountSid?, authToken?)` uses the credentials from the body; it falls back to `process.env.TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
- **Never** hardcode credentials in any file.
- **Never** commit `.env.local`.
- `EnvironmentProvider` / `useEnvironment()` is the only source of credentials on the client.

---

## 9. Security

### Mandatory rules

- **Never expose secrets.** No `console.log`, API response, or error message may contain `accountSid`, `authToken`, tokens, or any secret.
- **Validate all external input.** Every field received by Route Handlers must be validated by type and format before use.
- **Sanitize rendered data.** Data from the Twilio API is displayed only via React (JSX escapes by default). Never use `dangerouslySetInnerHTML`.
- **Do not trust client data.** Route Handlers revalidate all parameters even if the form already validates on the client.
- **Errors without leakage.** Error messages shown to users must be generic. Technical details must not appear in the UI.
- **Principle of least privilege.** Use only the Twilio scopes and resources required for each operation.

### Security checklist (required before completing any task)

- [ ] No credential or secret visible in code, logs, or responses
- [ ] All user input validated in the Route Handler
- [ ] No error message exposes a stack trace or internal details to the user
- [ ] No use of `dangerouslySetInnerHTML`
- [ ] No new dependency with a known vulnerability

---

## 10. localStorage and Persistence

Two persistence patterns coexist — do not mix them:

### Autocomplete (`StoredInput` / `StoredTextarea`)

- Managed by `lib/variables.ts` (`readVariables`, `addVariable`).
- Keys defined in `lib/stored-keys.ts` (`STORED_KEYS` + `STORED_KEY_LABELS`).
- When adding a field with autocomplete, add the key to `STORED_KEYS` and register the group in `VARIABLE_GROUPS` (in `lib/variables.ts`) so it appears on the Variables settings page.
- Limit of 10 items per key (`MAX_ITEMS`).

### Operation history

- Managed directly in each form component via `localStorage.getItem/setItem`.
- Key format: `switchboard:<domain>-history`.
- Limit of 5 entries (`MAX_HISTORY`).

---

## 11. Performance

- **Memoize only when necessary.** Do not add `useMemo`/`useCallback` preemptively; add them only when profiling identifies an unnecessary re-render or expensive computation.
- **No unnecessary dependencies.** Before installing a package, check whether the functionality already exists in the project or the standard library.
- **Lazy loading for heavy pages and components.** Use `next/dynamic` for large components used conditionally.
- **No implicit N+1 queries.** Batch operations over arrays must be sequential with SSE feedback, not uncontrolled parallel calls (respect Twilio API rate limits).

### Performance checklist

- [ ] No `useEffect` with a missing dependency or an unnecessary empty array
- [ ] No API call in the Server Component render path that could be cached
- [ ] No new package added without demonstrated necessity

---

## 12. Accessibility

- **Semantic HTML required.** Use `<button>`, `<label>`, `<fieldset>`, `<legend>`, `<nav>`, `<main>` according to the element's role.
- **Labels required.** Every `<input>`, `<select>`, and `<textarea>` must have an associated `<Label>` (via `htmlFor` or wrapper).
- **Keyboard navigation.** All interactive elements must be reachable via `Tab` and activated via `Enter`/`Space`.
- **Visible focus states.** Do not remove the focus outline without replacing it with an equivalent visual indicator.
- **Screen readers.** Destructive actions must have a descriptive `aria-label`. Status regions (SSE log) must have `role="log"` or `aria-live`.

### Accessibility checklist

- [ ] Every input has an associated label
- [ ] Every button has text or a descriptive `aria-label`
- [ ] Focus is visible on all interactive elements
- [ ] No interactive element is accessible only by mouse

---

## 13. Testing

This project has no configured test suite. Until one is set up:

- Manually validate the golden path and edge cases of every new feature before declaring the task complete.
- For destructive operations (closing conversations, cancelling tasks, assigning workers), also validate cancellation behavior via `AbortController`.
- When a test suite is added, follow: integration tests over Route Handlers (invalid input, missing credentials, SSE response), component tests for complex form logic.

---

## 14. Observability

- **No `console.log` in production.** Remove all debug logs before completing the task.
- **Twilio API errors** must be caught in `lib/` and emitted via `sseEvent("error", ...)` for streaming operations, or returned as `{ error: string }` for synchronous operations.
- **Retry with feedback.** Use `withRetry` from `features/conversations/lib/close.ts` as the standard for operations that should be retried. Emit a `"warning"` event on each failed attempt.
- **`done: true`** in the final SSE payload signals end of operation to the client — never omit it.

---

## 15. Documentation

- **`lib/strings.ts`** is the UI documentation — keep it organized and consistent.
- **`CLAUDE.md`** documents the architecture for AI tools — update it when structural patterns change.
- **`AGENTS.md`** (this file) documents rules for agents — update it when rules change.
- Add code comments only when the **reason** is non-obvious from the symbol name. Never document what the code does, only why it does it in a non-obvious way.
- Update documentation in the same PR that changes behavior — stale documentation is worse than none.

---

## 16. Rules for AI Agents

### Before modifying code

1. **Read the full context.** Read `CLAUDE.md` and this file. Inspect the files that will be modified, not just the target file.
2. **Understand the impact.** Identify all files that depend on the code being changed. Use grep to trace imports and references.
3. **Check `lib/strings.ts`.** If the task involves UI, locate the existing string or add a new one — never inline.
4. **Check `lib/stored-keys.ts`** if the task introduces new fields with autocomplete.

### During implementation

- **Do not change public APIs without justification.** Changes to the signature of functions exported from `lib/` or `features/<domain>/lib/` can break Route Handlers. Document in the PR.
- **Do not introduce dependencies without need.** Check whether the functionality exists in the project before installing a package.
- **Do not remove functionality without validation.** Confirm that no Route Handler, component, or page depends on the code before removing it.
- **Follow the two navigation registration places.** When adding a feature, register it in both `sidebar-nav.tsx` AND `features/<domain>/tools.ts`.
- **Maintain SSE pattern consistency.** Long-running operations must follow the established `ReadableStream` + `sseEvent` pattern.

### When finishing

- Explain non-obvious decisions in a code comment or commit message.
- Identify risks introduced by the change.
- Suggest architectural improvements when you identify excessive coupling, responsibility violations, or inconsistent patterns — but do not implement beyond the task scope.

---

## 17. Adding a New Feature

Follow this sequence **exactly**:

1. `features/<domain>/types.ts` — define the domain types
2. `features/<domain>/lib/<action>.ts` — implement the business logic
3. `app/api/<domain>/<action>/route.ts` — Route Handler with validation and SSE (if applicable)
4. `features/<domain>/components/<action>-form.tsx` — form Client Component
5. `app/(pages)/<domain>/<action>/page.tsx` — page wrapper (Server Component)
6. `lib/strings.ts` — add all new strings
7. `lib/stored-keys.ts` — add autocomplete keys if needed
8. `lib/variables.ts` — register the group in `VARIABLE_GROUPS` if keys were added
9. `components/sidebar-nav.tsx` — register the navigation item
10. `features/<domain>/tools.ts` — register the item on the landing page

---

## 18. Mandatory Final Checklist

Run **every** item before declaring a task complete:

### Code

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes with no errors
- [ ] No `any` introduced
- [ ] No dead code or unused imports
- [ ] No debug `console.log`

### Strings and UI

- [ ] All user-visible strings are in `lib/strings.ts`
- [ ] No English strings in the user interface
- [ ] New feature registered in both `sidebar-nav.tsx` and `features/<domain>/tools.ts`

### Security

- [ ] No credential exposed in code, logs, or responses
- [ ] All Route Handler input validated before use
- [ ] No error message leaks internal information

### Accessibility

- [ ] Every input has a label
- [ ] Every button has text or an `aria-label`
- [ ] Destructive operation displays `WarningBadge`

### Persistence

- [ ] New autocomplete fields have a key in `stored-keys.ts` and a group in `variables.ts`
- [ ] No localStorage key introduced without the `switchboard:` prefix

### SSE (if applicable)

- [ ] Final event includes `done: true`
- [ ] Component holds `AbortController` and exposes cancellation
- [ ] Correct SSE headers (`text/event-stream`, `no-cache`, `keep-alive`, `X-Accel-Buffering: no`)
