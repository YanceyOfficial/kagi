# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm format       # Prettier format (ts, tsx, md)

pnpm db:push      # Push schema changes directly (dev, no migration files)
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Run pending migrations
pnpm db:studio    # Open Drizzle Studio GUI
```

```bash
pnpm test          # Unit tests (vitest)
pnpm test:watch    # Unit tests in watch mode
pnpm test:e2e      # E2E tests (playwright, requires dev server running)
pnpm test:e2e:ui   # E2E tests with interactive UI
```

Unit tests live in `__tests__/unit/`. E2E tests live in `__tests__/e2e/`.
TypeScript errors surface via `tsc --noEmit` (run manually or relied on via build).

## Architecture

### Two-Level Key Structure

The core data model is:

1. **Key Category** (`key_categories`) — defines the _type_ and _format_ of a key (e.g. "OpenAI API"). Belongs to a `userId`.
2. **Key Entry** (`key_entries`) — a per-project instance of a category (e.g. "OpenAI for Blog project"). Stores the encrypted value.

Key types (`KeyType`): `simple` (single env var), `group` (multi-field map), `ssh` (file content), `json` (file content). The type is set on the category and determines how the entry's value is stored and displayed.

### Encryption

All secret values are encrypted at rest with AES-256-GCM in `lib/encryption.ts`. Ciphertext format: `iv:authTag:ciphertext` (all base64, colon-separated). The master key comes from `KAGI_ENCRYPTION_KEY` (64 hex chars = 32 bytes). Values are **never** returned in list/detail API responses — only exposed via explicit `POST /api/entries/[id]/reveal` or `POST /api/2fa/[id]/reveal` calls.

### Authentication

better-auth with the `genericOAuth` plugin for Keycloak OIDC (PKCE enabled). Server config in `lib/auth/index.ts`, client in `lib/auth/client.ts`. All API routes use the `withAuth()` + `requireSession()` pattern from `lib/api-helpers.ts`:

```ts
export async function GET(req: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession()
    // ... handler logic
  })
}
```

`requireSession()` throws `AuthError` on missing session; `withAuth()` catches it and returns 401.

### API Routes

All under `app/api/`. Ownership is always enforced by joining with `keyCategories.userId = session.user.id`. Routes never return `encryptedValue` — it's destructured out with `const { encryptedValue: _ev, ...safeEntry } = row`.

### Data Fetching

**All client-side HTTP goes through React Query hooks** in `lib/hooks/`. No direct `fetch` calls in components. Hooks follow a consistent pattern: `useXxx()` for queries, mutation hooks return `useMutation` results.

### Form Handling

**All forms use TanStack React Form** with Zod validators inline on each field. Pattern:

```tsx
<form.Field
  name="fieldName"
  validators={{
    onChange: ({ value }) => zodSchema.safeParse(value).error?.issues[0].message
  }}
>
  {(field) => (
    <Input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>
```

### AI Extraction (`app/api/ai/extract/route.ts`)

Privacy-preserving: AI only receives key names + project names (never values). Uses Vercel AI SDK `generateObject` with a Zod schema to get structured output. After AI selects entry IDs, the server validates them against the actual user's entry IDs (prevents injection), then decrypts and builds the `.env` file server-side.

### Monaco Editor

`components/ai/env-preview.tsx` wraps `react-monaco-editor`. Must be loaded with `dynamic(() => import(...), { ssr: false })` — SSR breaks Monaco's web worker setup.

## Key Gotchas

- **Zod v4**: Use `z.record(keySchema, valueSchema)` (both args required). Validation errors are on `.issues`, not `.errors`.
- **React Compiler (ESLint)**: `Date.now()` and `Math.random()` inside render functions trigger purity warnings. Compute them as `const` variables before the JSX return.
- **`withAuth` uses `any`**: The handler return type is `Promise<NextResponse<any>>` intentionally — route handlers return union types that TypeScript can't easily infer through the wrapper.
- **DB schema includes better-auth tables**: `user`, `session`, `account`, `verification` are defined in `lib/db/schema.ts` so `drizzle-kit` can migrate them. Don't remove them.
- **Tailwind v4 + oklch**: The theme uses `oklch()` color functions, not hex. Dark mode is forced globally (`html { @apply dark }`). Matrix green primary is `oklch(0.65 0.2 150)`.
