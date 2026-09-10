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

Node >= 22 required. Focused Worker feature tests run with `node --test tests/update-worker-feature.test.mjs`; they use the existing TypeScript compiler and mock Twilio without network calls. No general test suite is configured.

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

### Conversation consultation

Message bubbles show the original author without customer/service labels. A question-mark button at the top right reveals the Message SID on hover or keyboard focus and copies it on click/Enter/Space. The revealed SID also supports click-to-copy and text selection; clipboard success/failure is announced accessibly.

`/conversations/fetch-by-participant` has dedicated route and result skeletons shaped like its breadcrumb, header, phone form, state filters and Conversation cards. The result skeleton replaces only the result region during a search, leaving the form visible. Decorative placeholders are hidden from assistive technology, loading is announced through a single status, and animation respects reduced-motion preferences.

Each result from `/conversations/fetch-by-participant` has one “Consultar Conversation” action. It links to the unified consultation with the Conversation SID; a valid SID received through the query string starts the details request immediately, so users do not need to submit the prefilled form. Details and messages remain available as tabs on that destination.

Consultation loading uses domain-specific skeletons for route navigation, the summary, details/participants and message filters/chat bubbles. The messages skeleton also covers the lazy component download. Skeletons expose a single screen-reader status per loading region, hide decorative placeholders and respect reduced-motion preferences. Existing tabs and the SID remain usable during API loading; errors retain their retry action.

`/conversations/consult` combines details and messages behind one SID input and accessible tabs. Legacy `/conversations/fetch` and `/conversations/history` links redirect with the SID and target tab preserved. Links prefill the SID; the user submits the query. Details and messages retain separate POST endpoints; messages load only on first opening their tab. Tab changes preserve filters and loaded results; explicit refresh resets the query and reloads requested data. Filters and CSV export apply only to the loaded messages (at most the latest 1,000).

The Conversation SID, state and refresh action form the header of the main Details card.

The form composes details, participants and a dynamically loaded messages component. Request state and abort handling live in `use-conversation-query.ts`; filters and CSV serialization have separate modules. New searches, refreshes and environment changes unmount the previous query, abort requests and ignore late responses. Errors are generic and each tab can retry independently. Both endpoints validate the SID and optional credential pair before creating the client; invalid input returns 400 and credential/API failures return 500 without logging external error details.

Recent query SIDs use `switchboard:conversation-consult-history:<environmentId>` (five deduplicated entries). Existing message history for that environment seeds the list until the first write. Legacy details history is preserved but not imported because it has no environment identity. No message contents or query results are persisted.

Run `node --test tests/conversation-consult.test.mjs` for focused POST route tests covering malformed input, credential forwarding, environment fallback and sanitized failures with mocked Twilio calls.

Messages render as chronological chat bubbles: WhatsApp/SMS customer participants on the right, service messages on the left. `is-customer-message.ts` matches the message participant SID to a participant with a messaging address, falling back to an exact known customer address match (with the WhatsApp prefix normalized). Proxy addresses are not customer addresses. Unmatched authors stay on the left; alignment updates when the existing details request supplies participants. No extra Twilio requests are made. The bubble component retains author, timestamps, attachments and message SID; filtering and CSV export still use the original messages. Alignment tests cover customer addresses, agents, bots, system messages and proxy numbers.

### Worker feature overrides

`/taskrouter/update-worker-feature` enables or disables a Flex plugin by updating its `enabled` boolean in `config_overrides.features`. It accepts one to ten Workers by SID or email, resolves each identifier and fetches the current attributes before merging. Other attributes and existing plugin properties are preserved; malformed attribute structures fail without a write. Processing is sequential with SSE results and client/server cancellation checks. Cancellation stops subsequent writes but cannot undo or interrupt an update already sent to Twilio. Writes are not automatically retried, and concurrent edits from other tools can still race with the read/update operation.

`/taskrouter/workers` combines Worker details, skill assignment and feature configuration in accessible tabs with one shared Workspace SID. A Worker found in Details can be sent directly to either write operation. The legacy Worker page URLs redirect to the matching tab, while their API routes remain separate so each operation keeps its own validation and streaming behavior.

### localStorage persistence

All feature history sections use the shared `RecentHistory` and `RecentHistoryItem` components. They share the “Últimas consultas neste ambiente” heading, clear action, spacing, typography, em-dash separators, highlighted primary value and hover treatment while retaining each operation's domain-specific entry content. History entries for read-only searches rerun the query on click and restore their saved form values; write-operation entries remain informational so a history click can never repeat a destructive action.

Two separate layers:

- **StoredInput / StoredTextarea autocomplete**: per-key arrays (up to 10 items) managed by `lib/variables.ts` (`readVariables`, `addVariable`), keyed by constants in `lib/stored-keys.ts`, optionally scoped to an environment ID.
- **Operation history**: last 5 entries per form, stored under form-specific keys like `switchboard:close-history`, read/written directly inside each form component.

`ContactInput` is a specialised `StoredInput` for phone numbers that also reads named contacts from `lib/contacts.ts`.

### All UI strings

Every user-visible string lives in `lib/strings.ts` as a typed `const` object. Never inline string literals in components — always reference `strings.*`.

Page headers contain a concise title and subtitle. Longer introductory descriptions are omitted so the primary action appears sooner; metadata and tool-card descriptions remain available for their respective contexts.

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

| Component                                | Purpose                                          |
| ---------------------------------------- | ------------------------------------------------ |
| `StoredInput` / `StoredTextarea`         | Text inputs with localStorage autocomplete       |
| `ContactInput`                           | Phone input backed by saved contacts             |
| `LogOutput` + `createLogEntry`           | Terminal-style SSE log panel                     |
| `WarningBadge`                           | Badge shown on destructive/write-operation forms |
| `EnvironmentProvider` / `useEnvironment` | Active Twilio credential context                 |

### Constants (`lib/constants.ts`)

| Constant          | Value                         |
| ----------------- | ----------------------------- |
| `MAX_HISTORY`     | 5 (operation history entries) |
| `MAX_ITEMS`       | 10 (items per batch form)     |
| `RETRY_ATTEMPTS`  | 3                             |
| `RETRY_DELAY_MS`  | 2000                          |
| `TASK_LIST_LIMIT` | 1000                          |
