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

Requires Node.js 22+. Use Bun as the package manager (bun.lock is present).

## Architecture

Switchboard is a Next.js App Router dashboard for Twilio API operations. It has no database — all state is either fetched live from Twilio or stored in browser localStorage.

### Feature modules

Three domain modules live under `/features/`, each self-contained with `components/`, `lib/`, `types.ts`, and `tools.ts`:

- **conversations** — fetch, list, and batch-close Twilio Conversations
- **taskrouter** — manage workers, workflows, tasks, and queue cancellation
- **environments** — store and switch between multiple Twilio credential sets

### Request flow

1. User fills a form in a feature component
2. Form POSTs to a Next.js API route under `/app/api/`
3. The API route initializes a Twilio client from credentials passed in the request body (via `lib/twilio-client.ts`)
4. The route streams progress back using **Server-Sent Events (SSE)** — `Content-Type: text/event-stream`, JSON messages `{level, message, done}`
5. The `<LogOutput>` component in the UI consumes the SSE stream and renders color-coded log entries

### Credential management

Twilio Account SID and Auth Token are stored in browser localStorage under constants defined in `lib/stored-keys.ts`. The active environment is provided via React Context (`features/environments/context.tsx` → `useEnvironment()` hook). Credentials are sent from the client to API routes in the POST body on every request — they are never persisted server-side.

### UI strings

All user-facing text is in Portuguese (pt-BR). Strings are centralized in `lib/strings.ts`. Date formatting uses the `pt-BR` locale throughout.

### Component library

shadcn/ui components live in `components/ui/`. `StoredInput` and `StoredTextarea` are wrappers that automatically sync their value to localStorage.

### Error handling / retries

Long operations use a `withRetry` utility (3 attempts, 2-second exponential backoff). Errors are emitted as SSE messages with `level: "error"` rather than thrown HTTP errors, so partial progress is still visible to the user.
