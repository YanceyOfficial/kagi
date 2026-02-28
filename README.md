# Kagi 鍵

A self-hosted secret management system for developers. Store API keys, SSH keys, environment configs, and TOTP tokens — all encrypted at rest, organized by category and project, with AI-assisted `.env` file generation.

## Features

- **AES-256-GCM encryption** — all secret values encrypted before hitting the database; never returned in list responses
- **Key types**: `simple` (single env var), `group` (multi-field), `ssh` (file content), `json` (file content)
- **Two-level organization**: Categories (key type) → Entries (per-project instances)
- **2FA / TOTP** — store and reveal time-based one-time-password tokens
- **AI extraction** — describe your project, get a ready-to-paste `.env` file (AI sees only key names, never values)
- **SSO via Keycloak** — OIDC/PKCE, no local passwords

## Monorepo Structure

```
apps/
  kagi/   — Next.js main application
  docs/   — Astro Starlight documentation site
packages/
  eslint-config/   — shared ESLint rules (@kagi/eslint-config)
  tsconfig/        — shared TypeScript configs (@kagi/tsconfig)
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- PostgreSQL
- A running Keycloak instance

### Environment Variables

Copy `.env.example` in `apps/kagi/` and fill in:

```bash
DATABASE_URL=postgresql://...
KAGI_ENCRYPTION_KEY=<64 hex chars>   # openssl rand -hex 32
BETTER_AUTH_SECRET=<random string>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

KEYCLOAK_URL=https://your-keycloak
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=kagi
KEYCLOAK_CLIENT_SECRET=...

OPENAI_API_KEY=sk-...               # optional, for AI extraction
```

### Development

```bash
pnpm install
pnpm db:push          # push schema to DB (dev only)
pnpm dev              # start all apps via Turborepo
```

Or run a single app:

```bash
pnpm dev --filter=kagi
pnpm dev --filter=docs
```

### Database

```bash
pnpm db:push        # sync schema directly (dev)
pnpm db:generate    # generate migration files
pnpm db:migrate     # run pending migrations
pnpm db:studio      # open Drizzle Studio GUI
```

### Testing

```bash
pnpm test           # unit tests (vitest)
pnpm test:e2e       # E2E tests (requires dev server running)
```

### Lint & Type Check

```bash
pnpm lint           # ESLint across all apps
pnpm check-types    # tsc --noEmit across all apps
pnpm format         # Prettier
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | better-auth + Keycloak (genericOAuth) |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | React Query + Jotai |
| Forms | TanStack Form + Zod |
| AI | Vercel AI SDK + OpenAI gpt-4o-mini |
| Docs | Astro Starlight |
| Monorepo | Turborepo + pnpm |

## Security

Security is the core concern of this project. See [SECURITY.md](./SECURITY.md) for the vulnerability disclosure policy.

Key design decisions:
- Secret values are **never** returned by list or detail API endpoints — only via explicit `POST /api/entries/[id]/reveal`
- Encryption key (`KAGI_ENCRYPTION_KEY`) is never stored in the database
- AI extraction is privacy-preserving: the model only receives key names and project names

## License

[MIT](./LICENSE)
