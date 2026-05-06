# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server with Turbopack (http://localhost:3000)
bun build        # Production build
bun lint         # ESLint
bun format       # Prettier (writes in place)
bun typecheck    # tsc --noEmit
```

No test suite exists in this project.

## Architecture

Switchboard is a Next.js 16 (App Router) dashboard for Twilio API operations. Users configure Twilio credentials in the browser; credentials are stored in `localStorage` only and are never persisted server-side.

### Directory layout

```
app/
  (pages)/<feature>/<action>/page.tsx   # Thin page wrappers
  api/<feature>/<action>/route.ts       # API routes (server-side Twilio calls)
features/
  <feature>/
    components/<action>-form.tsx        # All UI + local state
    lib/<action>.ts                     # Twilio SDK logic (called from API routes)
    types.ts
    tools.ts                            # Tool card metadata for feature index pages
components/                             # Shared UI components
lib/
  strings.ts                            # All UI copy (Portuguese, as const)
  twilio-client.ts                      # getTwilioClient(accountSid, authToken)
  stored-keys.ts                        # localStorage key constants
  contacts.ts
  utils.ts                              # cn() + misc
```

### Data flow

1. `EnvironmentProvider` (wraps the whole app in `app/layout.tsx`) reads environments from `localStorage` and exposes `activeEnvironment` via `useEnvironment()`.
2. A form component reads `activeEnvironment` and passes `accountSid`/`authToken` in the POST body to the API route.
3. The API route calls `getTwilioClient(accountSid, authToken)` and executes Twilio SDK calls.

### SSE streaming pattern

Long-running operations (bulk close, assign workers, cancel queue tasks) stream progress via Server-Sent Events:

- **API route** creates a `ReadableStream`, emits `data: <JSON>\n\n` events (including a final `{ done: true }` event), and returns it with `Content-Type: text/event-stream`.
- **Form component** calls `res.body.getReader()`, splits chunks on `"\n\n"`, parses `data:` lines, and appends entries to a `LogOutput` component. The final `done` event triggers summary state.

### localStorage conventions

- Twilio environments: `twilio-environments` / `twilio-active-env`
- Operation history per form: `switchboard:<action>-history` (last 5 entries)
- `StoredInput` / `StoredTextarea`: autocomplete inputs that persist up to 10 recent values under a key from `lib/stored-keys.ts` (optionally scoped to `${key}:${environmentId}`)
- Contacts: managed via `lib/contacts.ts`

### Adding a new feature/action

1. Add Twilio logic to `features/<feature>/lib/<action>.ts`
2. Add API route at `app/api/<feature>/<action>/route.ts` (call `getTwilioClient` and stream or return JSON)
3. Add page at `app/(pages)/<feature>/<action>/page.tsx` (render form component)
4. Add form component at `features/<feature>/components/<action>-form.tsx`
5. Add strings to `lib/strings.ts`
6. Register the tool in `features/<feature>/tools.ts` and the sidebar in `components/sidebar-nav.tsx`
