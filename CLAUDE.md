# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Next.js + Turbopack)
npm run build      # Production build
npm run typecheck  # TypeScript check (no emit)
npm run lint       # ESLint
npm run format     # Prettier (ts/tsx files)
```

Node >= 22 required. No test suite is configured.

## Architecture

Switchboard is a Next.js 16 (App Router) dashboard for Twilio operations — Conversations API, TaskRouter API, Numbers API, and Flex. The UI is in Brazilian Portuguese (pt-BR).

### Directory layout

- `app/(pages)/` — page components (Client Components wrapping feature forms)
- `app/api/` — Next.js Route Handlers (server-side Twilio API calls)
- `features/<domain>/` — self-contained domain modules:
  - `components/` — form components (Client Components)
  - `lib/` — business logic called by Route Handlers
  - `types.ts` — domain types
  - `tools.ts` — nav item definitions used by the domain landing page
- `components/` — shared UI primitives and composed components
- `lib/` — cross-cutting utilities

### Environment / credentials system

Twilio credentials are stored entirely in the browser's `localStorage` (never server-side). `features/environments/storage.ts` handles serialization of `TwilioEnvironment` objects (`{ id, name, accountSid, authToken }`); `features/environments/context.tsx` exposes `EnvironmentProvider` and `useEnvironment()`. The active environment's `accountSid` and `authToken` are forwarded in the JSON body of every `POST` to `app/api/**`. Route Handlers pass them to `getTwilioClient()` in `lib/twilio-client.ts`, which falls back to `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` env vars if credentials are absent.

### SSE streaming pattern

Long-running operations (close conversations, cancel queue tasks, assign workers) return `text/event-stream` responses from Route Handlers. The form component opens a `ReadableStream` reader and parses `data:` lines. Each event is a JSON object `{ level, message, done?, totalClosed?, totalErrors?, progress? }` where `level` is one of `"info" | "success" | "warning" | "error"`. The `LogOutput` component renders the accumulated entries in a terminal-style panel. All forms hold an `AbortController` ref so users can cancel mid-operation.

### localStorage persistence

Two separate layers:
- **StoredInput / StoredTextarea autocomplete**: per-key arrays (up to 10 items) managed by `lib/variables.ts` (`readVariables`, `addVariable`), keyed by constants in `lib/stored-keys.ts`, optionally scoped to an environment ID.
- **Operation history**: last 5 entries per form, stored under form-specific keys like `switchboard:close-history`, read/written directly inside each form component.

`ContactInput` is a specialised `StoredInput` for phone numbers that also reads named contacts from `lib/contacts.ts`.

### All UI strings

Every user-visible string lives in `lib/strings.ts` as a typed `const` object. Never inline string literals in components — always reference `strings.*`.

### Adding a new feature

1. Create `features/<domain>/types.ts`, `lib/<action>.ts`, `components/<action>-form.tsx`, `tools.ts`
2. Add Route Handler at `app/api/<domain>/<action>/route.ts`
3. Add page at `app/(pages)/<domain>/<action>/page.tsx` (thin wrapper around the form component)
4. Register nav items in **two places**:
   - `components/sidebar-nav.tsx` — add to the domain's `NavItem[]` array (used for sidebar navigation)
   - `features/<domain>/tools.ts` — add to the domain's `Tool[]` array (used by the domain landing page)
5. Add strings to `lib/strings.ts`
6. If the feature introduces new autocomplete fields, add keys to `lib/stored-keys.ts` (`STORED_KEYS` + `STORED_KEY_LABELS`) and add the group to `VARIABLE_GROUPS` in `lib/variables.ts` so it appears in the Variables settings page.

The `available` boolean on each `Tool` in `tools.ts` controls whether the item renders normally or as a "coming soon" card on the domain landing page.

### Key shared components

| Component | Purpose |
|---|---|
| `StoredInput` / `StoredTextarea` | Text inputs with localStorage autocomplete |
| `ContactInput` | Phone input backed by saved contacts |
| `LogOutput` + `createLogEntry` | Terminal-style SSE log panel |
| `WarningBadge` | Badge shown on destructive/write-operation forms |
| `EnvironmentProvider` / `useEnvironment` | Active Twilio credential context |

### Constants (`lib/constants.ts`)

| Constant | Value |
|---|---|
| `MAX_HISTORY` | 5 (operation history entries) |
| `MAX_ITEMS` | 10 (items per batch form) |
| `RETRY_ATTEMPTS` | 3 |
| `RETRY_DELAY_MS` | 2000 |
| `TASK_LIST_LIMIT` | 1000 |
