# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Next.js + Turbopack)
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier (all .ts/.tsx)
npm run typecheck  # tsc --noEmit
```

No test runner is configured.

## Architecture

Switchboard is a Next.js 16 (App Router) dashboard for Twilio operations. It has no database — all user data (credentials, contacts, autocomplete history) lives in `localStorage`. The Twilio SDK runs server-side in API routes; credentials are forwarded from the client via request headers.

### Feature-based structure

Each Twilio API section follows a consistent layout under `features/[feature]/`:

```
features/[feature]/
  types.ts                     # TypeScript types for this API domain
  tools.ts                     # Tool list shown on the feature index page
  lib/[operation].ts           # Business logic calling the Twilio SDK
  components/[operation]-form.tsx  # Form + result display (client component)
```

Corresponding Next.js files:
- `app/(pages)/[feature]/[operation]/page.tsx` — page shell that renders the form component
- `app/api/[feature]/[operation]/route.ts` — API route that reads credentials from headers, calls `features/[feature]/lib/[operation].ts`

### Credential flow

1. The user selects an environment (Account SID + Auth Token) in the sidebar.
2. `EnvironmentProvider` (`features/environments/context.tsx`) stores it in React context, backed by `localStorage` via `features/environments/storage.ts`.
3. Form components read `activeEnvironment` from `useEnvironment()` and send credentials as `x-twilio-account-sid` / `x-twilio-auth-token` headers on every API call.
4. API routes extract those headers and pass them to `getTwilioClient()` (`lib/twilio-client.ts`), which falls back to `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` env vars if headers are absent.

### Strings

All user-facing text lives in `lib/strings.ts` as a single typed `const`. Never hardcode text in components — always reference `strings.*`.

### Autocomplete inputs

- `StoredInput` / `StoredTextarea` — inputs that save and recall previously typed values from `localStorage`. Storage keys are defined in `lib/stored-keys.ts` as `STORED_KEYS.*`.
- `ContactInput` — phone number field with autocomplete from the contacts saved in `/settings/contacts` (`lib/contacts.ts`).
- `VARIABLE_GROUPS` in `lib/variables.ts` maps storage keys to the labels shown in `/settings/variables`.

### Adding a new tool

1. Add types to `features/[feature]/types.ts`
2. Add business logic to `features/[feature]/lib/[operation].ts`
3. Add API route at `app/api/[feature]/[operation]/route.ts`
4. Add form component at `features/[feature]/components/[operation]-form.tsx`
5. Add page at `app/(pages)/[feature]/[operation]/page.tsx`
6. Register the tool in `features/[feature]/tools.ts`
7. Add a nav item in `components/sidebar-nav.tsx`
8. Add all strings to `lib/strings.ts`

### Key constants

`lib/constants.ts` defines shared limits: `MAX_HISTORY` (5), `MAX_ITEMS` (10), `RETRY_ATTEMPTS` (3), `RETRY_DELAY_MS` (2000), `TASK_LIST_LIMIT` (1000).

### UI

shadcn/ui components live under `components/ui/`. Tailwind CSS v4 is used with `tw-animate-css`. Icons come from `lucide-react`. The theme is toggled by pressing `d`.
