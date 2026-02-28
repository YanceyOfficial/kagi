# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo structure

```
kagi/                        ← repo root (Turborepo)
├── apps/
│   ├── kagi/                ← Next.js main application
│   └── docs/                ← Astro Starlight documentation site
└── packages/
    ├── eslint-config/       ← @kagi/eslint-config (base.mjs, next.mjs)
    └── tsconfig/            ← @kagi/tsconfig (base.json, nextjs.json)
```

## Commands

Run from the **repo root** (Turborepo orchestrates all apps):

```bash
pnpm dev          # Start all dev servers in parallel (Turbopack for kagi)
pnpm build        # Production build for all apps
pnpm lint         # ESLint + astro check across all apps
pnpm format       # Prettier format (ts, tsx, md)
```

Run scoped to one app when you only need it:

```bash
pnpm --filter kagi dev
pnpm --filter docs dev
```

Database (kagi app only):

```bash
pnpm --filter kagi db:push      # Push schema changes directly (dev, no migration files)
pnpm --filter kagi db:generate  # Generate migration files
pnpm --filter kagi db:migrate   # Run pending migrations
pnpm --filter kagi db:studio    # Open Drizzle Studio GUI
```

Testing (kagi app only):

```bash
pnpm --filter kagi test          # Unit tests (vitest)
pnpm --filter kagi test:watch    # Unit tests in watch mode
pnpm --filter kagi test:e2e      # E2E tests (playwright, requires dev server running)
pnpm --filter kagi test:e2e:ui   # E2E tests with interactive UI
```

Unit tests: `apps/kagi/__tests__/unit/`. E2E tests: `apps/kagi/__tests__/e2e/`.

## Architecture (apps/kagi)

### DB Schema (`lib/db/schema.ts`)

Five application tables on top of the four better-auth tables (`user`, `session`, `account`, `verification`):

| Table | Description |
|-------|-------------|
| `key_categories` | Key type definitions (name, keyType, envVarName, icon, color) |
| `key_entries` | Per-project instances of a category; holds `encryptedValue` |
| `two_factor_tokens` | Encrypted 2FA recovery token arrays per service |
| `access_keys` | Programmatic API keys (SHA-256 hashed, scoped, optional expiry) |

**Do not remove the better-auth tables** (`user`, `session`, `account`, `verification`) — drizzle-kit needs them to manage migrations.

### Two-Level Key Structure

1. **Key Category** (`key_categories`) — defines the *type* and *format* of a key (e.g. "OpenAI API"). Belongs to a `userId`.
2. **Key Entry** (`key_entries`) — a per-project instance of a category (e.g. "OpenAI for Blog project"). Stores the encrypted value.

`KeyType` enum: `simple` (single env var) | `group` (multi-field JSON map) | `ssh` (file content) | `json` (credential file).
`Environment` enum: `production` | `staging` | `development` | `local`.

### Encryption (`lib/encryption.ts`)

AES-256-GCM. Ciphertext format: `iv:authTag:ciphertext` (all base64, colon-separated). Master key from `KAGI_ENCRYPTION_KEY` (64 hex chars = 32 bytes).

- `simple` → encrypt plaintext string
- `group` → `encryptJson({ [field]: value })`
- `ssh` / `json` → encrypt raw file content string

Values are **never** returned in list/detail API responses — only via explicit `/reveal` calls.

### Authentication (`lib/api-helpers.ts`)

Two auth methods, resolved inside `requireSession(requiredScope?)`:

1. **Access key** — `Authorization: Bearer kagi_<token>` header. Server hashes the token (SHA-256), looks up `access_keys` table, checks expiry, checks scopes. Updates `lastUsedAt` fire-and-forget.
2. **Browser session** — cookie via better-auth + Keycloak OIDC. Session auth gets `scopes = null` which means full access (no scope restriction).

```ts
export async function GET() {
  return withAuth(async () => {
    const session = await requireSession('entries:read')  // pass scope for access-key enforcement
    // session.user.id is always available
  })
}
```

- `requireSession()` without a scope arg → no scope check (used by access-key management routes)
- `requireSession('scope:name')` → access keys must include that scope, throws 403 otherwise
- `withAuth()` catches `AuthError` → 401/403 JSON; catches other errors → 500 JSON

### Access Keys (`lib/access-key.ts`)

- Format: `kagi_<43-char-base64url>` (randomBytes(32))
- Stored as SHA-256 hex hash only — plaintext never persisted
- `keyPrefix` (e.g. `kagi_ab12cd34`) shown in UI for identification
- 11 scopes: `categories:read/write`, `entries:read/write/reveal`, `2fa:read/write/reveal`, `stats:read`, `export:read`, `ai:extract`
- `POST /api/access-keys` returns `{ ...fields, key }` once — key not retrievable after that

### API Routes (`app/api/`)

| Route | Auth |
|-------|------|
| `GET /api/openapi` | Public (no auth) |
| `GET/POST /api/categories` | `categories:read` / `categories:write` |
| `GET/PUT/DELETE /api/categories/[id]` | `categories:read` / `categories:write` |
| `GET/POST /api/entries` | `entries:read` / `entries:write` |
| `GET/PUT/DELETE /api/entries/[id]` | `entries:read` / `entries:write` |
| `POST /api/entries/[id]/reveal` | `entries:reveal` |
| `GET/POST /api/2fa` | `2fa:read` / `2fa:write` |
| `PUT/DELETE /api/2fa/[id]` | `2fa:write` |
| `POST /api/2fa/[id]/reveal` | `2fa:reveal` |
| `GET /api/stats` | `stats:read` |
| `GET /api/export` | `export:read` |
| `POST /api/ai/extract` | `ai:extract` |
| `GET/POST /api/access-keys` | Any valid auth (no scope required) |
| `DELETE /api/access-keys/[id]` | Any valid auth (no scope required) |

Ownership is always enforced: joins or `where` clauses include `userId = session.user.id`. Routes never return `encryptedValue` — destructured out with `const { encryptedValue: _ev, ...safeEntry } = row`.

### OpenAPI Spec (`lib/openapi-spec.ts`)

`buildOpenApiSpec(baseUrl)` returns a full OpenAPI 3.1.0 object. Served publicly at `GET /api/openapi` (1-hour cache). Used by `apps/docs` as the API reference source.

### Data Fetching

All client-side HTTP goes through React Query hooks in `lib/hooks/`:

| Hook file | Hooks |
|-----------|-------|
| `use-categories.ts` | `useCategories`, `useCategory`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory` |
| `use-entries.ts` | `useEntries`, `useEntry`, `useRevealEntry`, `useCreateEntry`, `useUpdateEntry`, `useDeleteEntry` |
| `use-2fa.ts` | `use2faTokens`, `useReveal2fa`, `useCreate2fa`, `useUpdate2fa`, `useDelete2fa` |
| `use-stats.ts` | `useStats` |
| `use-access-keys.ts` | `useAccessKeys`, `useCreateAccessKey`, `useRevokeAccessKey` |

No direct `fetch` calls in components.

### Form Handling

All forms use **TanStack React Form** with inline Zod validators:

```tsx
<form.Field
  name="fieldName"
  validators={{
    onChange: ({ value }) => zodSchema.safeParse(value).error?.issues[0].message
  }}
>
  {(field) => (
    <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
  )}
</form.Field>
```

### AI Extraction (`app/api/ai/extract/route.ts`)

Privacy-preserving: AI receives only key names + project names (never values). Uses Vercel AI SDK `generateObject` with a Zod schema. After AI selects entry IDs, server validates them against the user's actual IDs (prevents injection), decrypts values, and assembles the `.env` file server-side.

### Monaco Editor

`components/ai/env-preview.tsx` wraps `react-monaco-editor`. Must be loaded with `dynamic(() => import(...), { ssr: false })` — SSR breaks Monaco's web worker setup.

## Key Gotchas

- **Zod v4**: Use `z.record(keySchema, valueSchema)` (both args required). Validation errors are on `.issues`, not `.errors`.
- **React Compiler (ESLint)**: `Date.now()` and `Math.random()` inside render functions trigger purity warnings. Move them to `const` variables before the JSX return.
- **`withAuth` uses `any`**: `Promise<NextResponse<any>>` intentionally — union return types can't be inferred through the wrapper.
- **DB schema includes better-auth tables**: `user`, `session`, `account`, `verification` in `lib/db/schema.ts`. Don't remove them.
- **Tailwind v4 + oklch**: Theme uses `oklch()` color functions, not hex. Dark mode forced globally (`html { @apply dark }`). Matrix green primary: `oklch(0.65 0.2 150)`.
- **`requireSession()` scope enforcement**: `scopes === null` (session auth) = full access; `scopes = []` (access key with no matching scope) = 403. Don't skip the scope arg on routes that should be scope-restricted.
- **Access key `lastUsedAt`**: Updated fire-and-forget (`db.update(...).catch(() => {})`). Not awaited — don't change this to `await`.
