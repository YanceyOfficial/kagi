# Contributing to Kagi

Thanks for your interest in contributing! Please take a moment to read through this guide before submitting anything.

## Repo Setup

Kagi is a monorepo using pnpm workspaces and Turborepo. You must use [pnpm](https://pnpm.io/) (v9) as the package manager.

```bash
# Enable corepack to pin the pnpm version automatically
corepack enable

git clone https://github.com/YanceyOfficial/kagi.git
cd kagi
pnpm install
```

You'll need a running PostgreSQL database and Keycloak instance. Copy `apps/kagi/.env.example` to `apps/kagi/.env` and fill in the values.

```bash
pnpm db:push   # sync schema to your local DB
pnpm dev       # start all apps
```

## Development Workflow

- Unit tests live in `apps/kagi/__tests__/unit/` — run with `pnpm test`
- E2E tests live in `apps/kagi/__tests__/e2e/` — run with `pnpm test:e2e` (requires dev server)
- Lint: `pnpm lint` (ESLint via Turbo)
- Type check: `pnpm check-types`
- Format: `pnpm format` (Prettier, auto-run on commit via Husky)

The pre-commit hook runs `pnpm turbo lint` automatically.

## Pull Request Guidelines

- Branch off `master` and merge back into `master`.
- Keep PRs focused — one concern per PR.

**Bug fix:**

- Reference the issue: `fixes #123` in the PR description.
- Add a regression test if feasible.

**New feature:**

- Open an issue first to discuss the approach before writing code.
- Include tests.

**Security fix:**

- Do **not** open a public PR. Follow the process in [SECURITY.md](./SECURITY.md).

Commits should follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add SSH key type support
fix: decrypt error on empty iv
docs: update env variable table
chore: bump drizzle-orm to 0.45
```

PRs with multiple small commits are fine — we squash on merge.

## Architecture Notes

A few things worth knowing before diving in:

- **Never return `encryptedValue`** from API routes. Always destructure it out: `const { encryptedValue: _ev, ...safe } = row`.
- **All client fetches go through React Query hooks** in `lib/hooks/`. No direct `fetch` in components.
- **All forms use TanStack Form + Zod** — see existing dialogs for the pattern.
- **Zod v4**: validation errors are on `.issues`, not `.errors`. `z.record()` requires both key and value schemas.
- **React Compiler (ESLint)**: `Date.now()` and `Math.random()` inside render trigger purity warnings — compute them outside JSX or in a ref.
