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

No test suite is configured.

## Architecture

Switchboard is a Next.js 16 (App Router) dashboard for Twilio operations — Conversations API, TaskRouter API, and Numbers API. The UI is in Brazilian Portuguese (pt-BR).

### Directory layout

- `app/(pages)/` — page components (Client Components wrapping feature forms)
- `app/api/` — Next.js Route Handlers (server-side Twilio API calls)
- `features/<domain>/` — self-contained domain modules:
  - `components/` — form components (Client Components)
  - `lib/` — business logic called by Route Handlers
  - `types.ts` — domain types
  - `tools.ts` — nav item definitions (icon, href, label)
- `components/` — shared UI primitives and composed components
- `lib/` — cross-cutting utilities

### Environment / credentials system

Twilio credentials are stored entirely in the browser's `localStorage` (never server-side). `features/environments/storage.ts` handles serialization; `features/environments/context.tsx` exposes `EnvironmentProvider` and `useEnvironment()`. The active environment's `accountSid` and `authToken` are forwarded in the JSON body of every `POST` to `app/api/**`. Route Handlers pass them to `getTwilioClient()` in `lib/twilio-client.ts`, which falls back to `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` env vars if credentials are absent.

### SSE streaming pattern

Long-running operations (close conversations, cancel queue tasks, assign workers) return `text/event-stream` responses from Route Handlers. The form component opens a `ReadableStream` reader and parses `data:` lines. Each event is a JSON object `{ level, message, done?, totalClosed?, totalErrors?, progress? }`. The `LogOutput` component renders the accumulated entries in a terminal-style panel. All forms hold an `AbortController` ref so users can cancel mid-operation.

### localStorage persistence

`StoredInput` and `StoredTextarea` components autocomplete from per-key localStorage arrays (up to 10 saved values, keyed by `storageKey` from `lib/stored-keys.ts`, optionally scoped to an environment ID). `ContactInput` is a specialised `StoredInput` for phone numbers that also reads named contacts from `lib/contacts.ts`. Operation history (last 5 entries per form) is stored under form-specific keys such as `switchboard:close-history`.

### All UI strings

Every user-visible string lives in `lib/strings.ts` as a typed `const` object. Never inline string literals in components — always reference `strings.*`.

### Adding a new feature

1. Create `features/<domain>/types.ts`, `lib/<action>.ts`, `components/<action>-form.tsx`, `tools.ts`
2. Add Route Handler at `app/api/<domain>/<action>/route.ts`
3. Add page at `app/(pages)/<domain>/<action>/page.tsx` (thin wrapper around the form component)
4. Register nav items in `components/sidebar-nav.tsx` and add strings to `lib/strings.ts`

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
