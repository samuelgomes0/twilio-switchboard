# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server with Turbopack
bun run build    # Production build
bun lint         # ESLint
bun run format   # Prettier (writes in place)
bun run typecheck # tsc --noEmit
```

Requires Node.js 22+. Use Bun as the package manager (`bun.lock` is present). There are no tests.

## Architecture

Switchboard is a Next.js 16 App Router dashboard for Twilio API operations. It has no database — all state is either fetched live from Twilio or stored in browser `localStorage`.

### Feature modules

Three domain modules live under `features/`, each self-contained with `components/`, `lib/`, `types.ts`, and `tools.ts`:

- **conversations** — fetch, list, and batch-close Twilio Conversations
- **taskrouter** — manage workers, workflows, tasks, and queue cancellation
- **environments** — store and switch between multiple Twilio credential sets (persisted via `features/environments/storage.ts`)

The **contacts** feature is a partial exception: its component lives at `features/contacts/components/contacts-manager.tsx` but its data layer (`lib/contacts.ts`) is in the root `lib/` directory alongside other utilities. It has no `types.ts` or `tools.ts`.

### Request flow

1. User fills a form in a feature component
2. Form POSTs to a Next.js API route under `app/api/`
3. The API route initializes a Twilio client from credentials passed in the request body (via `lib/twilio-client.ts`)
4. The route streams progress back using **Server-Sent Events (SSE)** — `Content-Type: text/event-stream`, JSON messages `{level, message, done}`
5. The `<LogOutput>` component in the UI consumes the SSE stream and renders color-coded log entries

SSE events are formatted using `sseEvent()` from `features/conversations/lib/close.ts` — this helper is imported by API routes across all features.

### Credential management

Twilio Account SID and Auth Token are stored in browser `localStorage`. The active environment is provided via React Context (`features/environments/context.tsx` → `useEnvironment()` hook). Credentials are sent from the client to API routes in the POST body on every request — they are never persisted server-side. As a fallback, API routes also accept `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` env vars (useful for `.env.local` during local dev).

### UI strings

All user-facing text is in Portuguese (pt-BR). Strings are centralized in `lib/strings.ts`. Date formatting uses the `pt-BR` locale throughout.

### Component library

shadcn/ui components live in `components/ui/`.

**`StoredInput`** and **`StoredTextarea`** are autocomplete wrappers that persist up to 10 recent values per `storageKey` in `localStorage`, optionally scoped by `environmentId`. Storage key constants are in `lib/stored-keys.ts`.

**`ContactInput`** is a phone-number input that autocompletes from the contact book (`lib/contacts.ts`) and lets users save new contacts inline from the dropdown.

### Phone number format

Phone numbers throughout the app are stored/entered as `{DDD}{number}` (Brazilian format, without the digit 9), and are formatted to `whatsapp:+55{number}` by `formatPhoneNumber()` in `features/conversations/lib/close.ts` before being sent to Twilio.

### Error handling / retries

Long operations use a `withRetry` utility (defined in `features/conversations/lib/close.ts` — 3 attempts, 2-second exponential backoff). Errors are emitted as SSE messages with `level: "error"` rather than thrown HTTP errors, so partial progress is still visible to the user.
