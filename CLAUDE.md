# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Next.js + Turbopack)
npm run build      # Production build
npm run typecheck  # TypeScript check (no emit)
npm test           # Run all existing Node.js tests with mocked Twilio calls
npm run lint       # ESLint
npm run format     # Prettier (ts/tsx files)
```

Node >= 22 required. `npm test` runs the Node.js suites for Conversation consultation, operation messages, Worker features, the shared TypeScript loader and UI feedback markup. They use the existing TypeScript compiler and mock Twilio without network calls. `tests/redesign-browser.mjs` is an optional browser suite using an externally installed Playwright module and Edge; it is not part of `npm test`. See `REDESIGN.md` for execution and validation limitations.

`tests/typescript-loader.mjs` shares CommonJS/ES2022 transpilation, `@/` alias resolution and module overrides. `createLoader(overrides)` owns its cache per instance, preserving class identity in operation-message tests. `load(relative, overrides)` disables TypeScript caching for Conversation consultation and Worker-feature tests, including nested imports. Native modules still use Node's require cache; relative TypeScript imports still need explicit overrides.

`tests/ui-feedback.test.mjs` validates feedback markup with React SSR and isolated TSX loading. Hook initializers are seeded in memory; effects, requests and handlers do not run. This does not provide browser or visual validation.

## Architecture

Switchboard is a Next.js 16 (App Router) dashboard for Twilio operations — Conversations API, TaskRouter API, Numbers API, and Flex. The UI is in Brazilian Portuguese (pt-BR).

### Canonical URLs and compatibility

Pages and POST endpoints use descriptive action names (for example `/conversations/search-by-number`, `/api/conversations/close-by-sid` and `/api/taskrouter/add-skill-to-workers`). The complete migration inventory lives in `lib/route-migrations.mjs`. `next.config.mjs` uses its page mapping for permanent redirects, preserving query parameters and selecting the appropriate tab for legacy single-purpose pages. Old API routes re-export the canonical POST handler instead of redirecting HTTP requests, preserving credential bodies, streaming and cancellation semantics. Navigation, catalogs and browser requests use canonical URLs. Domain catalogs and the home page retain their existing domain paths. Component, business-module and persistence names remain independent of URLs. `tests/route-migrations.test.mjs` checks targets, handler identity and active references; `docs/urls-e-endpoints.md` documents the complete mapping. After a production build, `node tests/route-migrations-http.mjs` starts an isolated local server and checks actual redirects, query parameters, page responses and legacy/canonical POST compatibility using malformed JSON without Twilio calls.

### Directory layout

- `app/(pages)/` — Server Component page wrappers around feature forms, plus compatibility redirects
- `app/api/` — Next.js Route Handlers (server-side Twilio API calls)
- `features/<domain>/` — self-contained domain modules:
  - `components/` — form components (Client Components)
  - `lib/` — business logic called by Route Handlers
  - `types.ts` — domain types
  - `tools.ts` — nav item definitions used by the domain landing page
- `components/` — shared UI primitives and composed components
- `lib/` — cross-cutting utilities

### Shared interface

The red palette is centralized in `app/globals.css`: brand and destructive tokens reference primary tokens in both themes. Primary and destructive buttons use solid backgrounds with explicit foreground and hover colors; dialog confirmations use the shared button styles. Error text uses semantic destructive tokens rather than Tailwind red shades. `tests/color-contrast.test.mjs` validates WCAG AA text contrast for both themes; palette details are documented in `REDESIGN.md`.

`AppShell` owns the full-viewport shell with a single elevated right-hand surface: header and content share a 12px rounded panel, 8px inset and subtle shadow, with no overall width cap, 200px sidebar, sticky command/environment/theme header, main landmark and Radix Dialog mobile navigation. `SidebarNav` preserves separate domain navigation arrays, expands the active area (and Conversations/TaskRouter on the home page) and supports explicit group toggles. `CommandMenu` searches available tool labels/descriptions and settings with Ctrl/Cmd+K. Pages remain Server Component wrappers.

`PageHeader`, `ToolCatalog`, `ActionBar`, `ActionButton`, `InputActions`, `EmptyState`, `ClipboardButton` and the UI controls define shared presentation. `TaskResultCard` renders Task results without owning requests. Tokens and responsive rules live in `app/globals.css`; all visible copy remains in `lib/strings.ts`. `ToolDirectory` presents 13 available tools in a compact searchable table with area filtering, catalog counts and browser environment context. The content aligns next to the sidebar rather than centering within excess empty space.

`ThemeProvider` defaults to light and persists future choices in `switchboard:theme`; the legacy `theme` value is retained but ignored by this visual revision. Light/dark/system choices and the D hotkey remain available. `tests/redesign-preview.mjs` checks initial light appearance against a dark system/legacy setting and captures responsive home previews.

Searches share `SearchInput` and the `search-control` style, including directory, global command dialog, Numbers, messages and Tasks. Query inputs with autocomplete or phone prefixes retain `StoredInput`/`ContactInput` with the same style. `--workspace-gutter` aligns the shell header and main content at 48px desktop, 32px tablet and 20px mobile. The home Configure environment action centers vertically beside its title/subtitle, and the table header has an 8px gap before the first row. Other page heading actions align at the top; pages use the available content width, while forms keep their readability limit. The home table header has 6px corners.

`useBrowserState(read, fallback, scope)` uses the fallback for SSR and initial hydration, schedules browser storage reading after mount and reloads when scope changes. It does not change persistence keys or data formats. Histories, autocomplete and settings retain their own transformations and writes.

### Environment / credentials system

Twilio credentials are stored entirely in the browser's `localStorage` (never server-side). `features/environments/storage.ts` handles serialization of `TwilioEnvironment` objects (`{ id, name, accountSid, authToken }`); `features/environments/context.tsx` exposes `EnvironmentProvider` and `useEnvironment()`. The active environment's `accountSid` and `authToken` are forwarded in the JSON body of every `POST` to `app/api/**`. Route Handlers pass them to `getTwilioClient()` in `lib/twilio-client.ts`, which falls back to `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` env vars if credentials are absent.

### SSE streaming pattern

Long-running operations (close conversations, cancel queue tasks, assign workers) return `text/event-stream` responses from Route Handlers. The form component opens a `ReadableStream` reader and parses `data:` lines. Each event is a JSON object `{ level, message, done?, totalClosed?, totalErrors?, progress? }` where `level` is one of `"info" | "success" | "warning" | "error"`. The `LogOutput` component renders the accumulated entries in a terminal-style panel. All forms hold an `AbortController` ref so users can cancel mid-operation.

The six SSE consumers share `consumeSseStream(reader, onDataLine)` from `lib/sse-reader.ts` for incremental UTF-8 decoding, LF-delimited frames and the first data line. JSON parsing, callback errors, completion, state and reader ownership remain local: five forms ignore malformed events, while Worker Feature validates payloads, requires completion and releases the reader. Only Worker Feature propagates cancellation through its Route Handler to the operation. The six routes share `SSE_HEADERS` from `lib/sse-headers.ts`; stream lifecycle remains in each route. See `docs/fase-2d-sse.md` for the compatibility matrix and preserved limitations. `tests/sse-client.test.mjs` characterizes actual submit functions through AST extraction; `tests/sse-server.test.mjs` covers route transport with mocked operations.

### Conversation consultation

Active results in “Conversations por Número” and the Details tab of “Consultar Conversation” compose `CloseConversationButton`, with a destructive confirmation and `WarningBadge`. The single-conversation action posts the selected SID to `/api/conversations/close-by-sid`; it never closes other conversations for that participant. Input validation reuses `validateConsultInput`. `close-conversation.ts` fetches the current state and writes only if still active; nonactive results refresh the UI without a write. Success updates local state, reorders number-search results and removes the close action. This inline action has no separate page or navigation entry. The short operation returns JSON without automatic write retries. Unmount aborts the client request and ignores late responses; server cancellation before update prevents the write, but a write already sent to Twilio cannot be interrupted or undone. Twilio has no atomic conditional update, so a concurrent state change between fetch and update remains possible. Run `node --test tests/close-single-conversation.test.mjs` for guards, validation, selected-SID writes and cancellation.

“Conversations por Número” automatically follows every participant-conversation page using sequential POST requests (50 records per Twilio page). `use-participant-search.ts` owns request lifecycle, progress and AbortController; `search-participant-pages.ts` deduplicates by Conversation SID and sorts the accumulated results with active conversations first, then latest update. All loaded active results are visible; “Exibir mais” reveals additional nonactive results locally. Filters apply to the accumulated set, which remains partial until completion. Cancellation or failure preserves partial results with an explicit notice; only complete searches enter history. Environment changes and unmount abort the browser request and ignore late results. Cancellation prevents subsequent page requests but cannot interrupt a Twilio request already running on the server. The existing JSON endpoint remains paginated; no SSE or server persistence is introduced. Run `node --test tests/participant-search.test.mjs` for pagination, ordering, deduplication, cancellation and validation regressions.

“Encerrar por Número” searches the exact Brazilian WhatsApp participant address. It accepts DDD + number, country code 55 (with or without +), the full `whatsapp:+55` address and display punctuation. Shared normalization validates both the form and POST input without adding/removing subscriber digits. The SDK follows all participant-conversation pages before filtering for `active`, so a closed history exceeding 1,000 records cannot hide active matches. Only active conversations are closed; SMS, chat identities and proxy addresses are outside this form's scope. Existing client-only cancellation semantics remain unchanged. Run `node --test tests/close-conversations.test.mjs` for input and pagination regressions with mocked Twilio transport.

Message bubbles show the original author without customer/service labels. A question-mark button at the top right reveals the Message SID on hover or keyboard focus and copies it on click/Enter/Space. The revealed SID also supports click-to-copy and text selection; clipboard success/failure is announced accessibly.

`/conversations/search-by-number` has dedicated route and result skeletons shaped like its breadcrumb, header, phone form, state filters and Conversation cards. The result skeleton replaces only the result region during a search, leaving the form visible. Decorative placeholders are hidden from assistive technology, loading is announced through a single status, and animation respects reduced-motion preferences.

Each result from `/conversations/search-by-number` has one “Consultar Conversation” action. It links to the unified consultation with the Conversation SID; a valid SID received through the query string starts the details request immediately, so users do not need to submit the prefilled form. Details and messages remain available as tabs on that destination.

Consultation loading uses domain-specific skeletons for route navigation, the summary, details/participants and message filters/chat bubbles. The messages skeleton also covers the lazy component download. Skeletons expose a single screen-reader status per loading region, hide decorative placeholders and respect reduced-motion preferences. Existing tabs and the SID remain usable during API loading; errors retain their retry action.

`/conversations/consult-by-sid` combines details and messages behind one SID input and accessible tabs. Legacy `/conversations/fetch` and `/conversations/history` links redirect with the SID and target tab preserved. A valid SID from a link prefills the input and starts the query automatically; manually entered SIDs require submission. Details and messages retain separate POST endpoints; messages load only on first opening their tab. Tab changes preserve filters and loaded results; explicit refresh resets the query and reloads requested data. Filters and CSV export apply only to the loaded messages (at most the latest 1,000).

The Conversation SID, state and refresh action form the header of the main Details card.

The form composes details, participants and a dynamically loaded messages component. Request state and abort handling live in `use-conversation-query.ts`; filters and CSV serialization have separate modules. New searches, refreshes and environment changes unmount the previous query, abort requests and ignore late responses. Errors are generic and each tab can retry independently. Both endpoints validate the SID and optional credential pair before creating the client; invalid input returns 400 and credential/API failures return 500 without logging external error details.

Recent query SIDs use `switchboard:conversation-consult-history:<environmentId>` (five deduplicated entries). Existing message history for that environment seeds the list until the first write. Legacy details history is preserved but not imported because it has no environment identity. No message contents or query results are persisted.

Run `node --test tests/conversation-consult.test.mjs` for focused POST route tests covering malformed input, credential forwarding, environment fallback and sanitized failures with mocked Twilio calls.

Messages render as chronological chat bubbles: WhatsApp/SMS customer participants on the right, service messages on the left. `is-customer-message.ts` matches the message participant SID to a participant with a messaging address, falling back to an exact known customer address match (with the WhatsApp prefix normalized). Proxy addresses are not customer addresses. Unmatched authors stay on the left; alignment updates when the existing details request supplies participants. No extra Twilio requests are made. The bubble component retains author, timestamps, attachments and message SID; filtering and CSV export still use the original messages. Alignment tests cover customer addresses, agents, bots, system messages and proxy numbers.

### Worker feature overrides

Task queries share `map-task.ts` for their response fields and the environment-independent `infer-channel.ts` for channel classification. `SearchTaskResult` composes `TaskData` with the channel field. Conversation details, Worker details and Task results share `components/json-block.tsx`; Task results supply their existing wrapping and overflow classes explicitly.

`/taskrouter/update-worker-feature` enables or disables a Flex plugin by updating its `enabled` boolean in `config_overrides.features`. It accepts one to ten Workers by SID or email, resolves each identifier and fetches the current attributes before merging. Other attributes and existing plugin properties are preserved; malformed attribute structures fail without a write. Processing is sequential with SSE results and client/server cancellation checks. Cancellation stops subsequent writes but cannot undo or interrupt an update already sent to Twilio. Writes are not automatically retried, and concurrent edits from other tools can still race with the read/update operation.

`/taskrouter/manage-workers` combines Worker details, skill assignment and feature configuration in accessible tabs with one shared Workspace SID. A Worker found in Details can be sent directly to either write operation. The legacy Worker page URLs redirect to the matching tab, while their API routes remain separate so each operation keeps its own validation and streaming behavior.

### localStorage persistence

All feature history sections use the shared `RecentHistory` and `RecentHistoryItem` components. Their heading is “Atividade recente neste navegador”; domain-specific entry content, keys and scopes remain intact. History entries for read-only searches rerun the query on click and restore their saved form values; write-operation entries remain informational without pointer/hover action treatment, so a history click can never repeat a destructive action.

Two separate layers:

- **StoredInput / StoredTextarea autocomplete**: per-key arrays (up to 10 items) managed by `lib/variables.ts` (`readVariables`, `addVariable`), keyed by constants in `lib/stored-keys.ts`, optionally scoped to an environment ID.
- **Operation history**: shared `readHistory<T>(key)` and `pushHistory(key, entry)` in `lib/operation-history.ts` preserve existing form-specific keys and JSON formats. Prepending keeps duplicates and limits writes to `MAX_HISTORY` (5); reading does not trim or validate existing entries. Forms retain payload construction, state hydration and clear actions. The specialized Conversation consultation history hook remains separate for validation, deduplication and legacy fallback.

Autocomplete persistence uses `lib/variables.ts`. `addVariable` and `deleteVariable` accept an optional fourth argument containing the component's current values; StoredInput and StoredTextarea pass that snapshot to preserve local-state updates without rereading storage. Existing callers omit it and continue reading storage before writes. StoredInput retains optional environment scoping, StoredTextarea remains global, and EnvironmentCard reads the explicit `baseKey:environmentId` key. No storage-event synchronization is introduced. Invalid JSON and read failures return an empty array; valid JSON with an unexpected shape retains the previous unchecked behavior. Write failures remain silent.

`ContactInput` is a specialised `StoredInput` for phone numbers that also reads named contacts from `lib/contacts.ts`.

### All UI strings

Every user-visible string lives in `lib/strings.ts` as a typed `const` object. Never inline string literals in components — always reference `strings.*`.

This includes accessibility labels, autocomplete actions and groups, placeholders, exported column/sheet/file names, API validation messages and SSE messages. Shared errors and retries live under `strings.common`; operation-specific messages live under the domain action's `log` object. Dynamic messages use typed functions. Protocol identifiers, CSV input contracts, storage keys and external resource data remain technical values, separate from display labels.

Client error handlers show centralized messages rather than raw exception messages. Expected workflow CSV validation errors use `AppError.safeMessage`; unexpected failures use generic messages. External error logging retains only numeric status/code metadata. The default queue-close message is defined in `strings.taskrouter.cancelQueueTasks.defaultCloseMessage`; client components read it there without importing the Twilio business module. `DEFAULT_CLOSE_MESSAGE` remains a server-side alias for compatibility.

`node --test tests/operation-messages.test.mjs` validates safe errors, expected CSV validation, retry feedback and successful SSE completion with mocked Twilio calls. The baseline inventory and follow-up audit are in `docs/auditoria-textos-hardcoded.md` and `docs/reauditoria-textos-hardcoded.md`.

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

`lib/tool.ts` defines the shared `Tool` contract for domain catalogs. Catalog definitions remain separate from sidebar navigation. `components/tool-card.tsx` renders compact rows as a Server Component: available tools link to their href; unavailable tools retain a noninteractive row and "coming soon" badge. `ToolCatalog` composes the page heading and list. The home page presents the searchable ToolDirectory with direct tool links and area filtering.

### Key shared components

Repeated page actions use `ActionButton` for consistent variants, 36px height, spacing and icons, and `ActionBar` for wrapping groups. All input-related actions sit beside the relevant field or field group in `InputActions`, including multi-field forms, batch submit/add/remove, save/cancel, credential verification, and result filtering/export/refresh. Labels remain above the row and hints/errors below it; narrow screens stack controls to preserve usable input widths. Flex actions follow the active integration field. Cancellation controls remain outside disabled fieldsets, while fields retain their running-state locks. Actions without an associated input stay with their section or item; confirmation actions are right aligned, cancel before confirmation. Each caller retains handlers, disabled/loading state, labels and confirmation/cancellation semantics.

| Component                                | Purpose                                          |
| ---------------------------------------- | ------------------------------------------------ |
| `StoredInput` / `StoredTextarea`         | Text inputs with localStorage autocomplete       |
| `ContactInput`                           | Phone input backed by saved contacts             |
| `ToolCard`                               | Tool links and unavailable-tool presentation     |
| `LogOutput` + `createLogEntry`           | Terminal-style SSE log panel                     |
| `NoEnvironmentSelected`                 | Shared contextual notice; callers retain environment conditions |
| `WarningBadge`                           | Badge shown on destructive/write-operation forms |
| `EnvironmentProvider` / `useEnvironment` | Active Twilio credential context                 |

Missing-environment notices compose `NoEnvironmentSelected`, with a nonurgent status, the existing blocking visual severity and the environments link. `LogOutput` owns the named polite log region; consumers should not add a second live log wrapper. Field errors stay associated with their inputs, operation errors stay inline, and batch summaries retain mixed outcomes without announcing a redundant success.

### Constants (`lib/constants.ts`)

| Constant          | Value                         |
| ----------------- | ----------------------------- |
| `MAX_HISTORY`     | 5 (operation history entries) |
| `MAX_ITEMS`       | 10 (items per batch form)     |
| `RETRY_ATTEMPTS`  | 3                             |
| `RETRY_DELAY_MS`  | 2000                          |
| `TASK_LIST_LIMIT` | 1000                          |
