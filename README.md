# Kagi 鍵

> A self-hosted private key management system with AI-powered extraction.

Kagi (Japanese: 鍵, _key_) is a secure vault for all your private keys, API credentials, SSH keys, and 2FA recovery tokens. Keys are encrypted at rest with AES-256-GCM and accessed through a clean, geeky terminal-themed interface.

---

## Features

- **Multiple key formats** — simple strings (`OPENAI_API_KEY`), grouped fields (AWS S3), SSH key files, JSON credential files, and 2FA recovery tokens
- **Two-level organization** — key categories (service type) → entries (per-project instances)
- **Encryption at rest** — AES-256-GCM with a master key you control; values are never stored in plaintext
- **AI-powered extraction** — describe what you need in plain English; the AI selects the right keys and generates a ready-to-use `.env` file. The AI never sees actual secret values
- **Keycloak SSO** — authentication is delegated entirely to your existing Keycloak instance
- **Dashboard analytics** — key type distribution, environment breakdown, expiry tracking
- **Search** — filter across all categories and entries
- **File upload** — drag-and-drop SSH keys and JSON credential files; download them back on demand

---

## Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Framework       | Next.js 16 (App Router, RSC)         |
| Database        | PostgreSQL + Drizzle ORM             |
| Auth            | better-auth + Keycloak (OIDC)        |
| UI              | shadcn/ui + Tailwind CSS v4          |
| Data fetching   | TanStack React Query                 |
| Forms           | TanStack React Form + Zod            |
| AI              | Vercel AI SDK + OpenAI (gpt-4o-mini) |
| Editor          | Monaco Editor                        |
| Package manager | pnpm                                 |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL database
- Keycloak instance with a configured client
- OpenAI API key (for AI extraction)

### 1. Clone and install

```bash
git clone <repo-url>
cd kagi
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all required values. Pay special attention to:

```bash
# Generate a 32-byte encryption key (never lose this — you cannot recover encrypted data without it)
openssl rand -hex 32   # paste result as KAGI_ENCRYPTION_KEY

# Generate a session secret
openssl rand -hex 32   # paste result as BETTER_AUTH_SECRET
```

See [`.env.example`](.env.example) for all variables and descriptions.

### 3. Set up the database

```bash
# Push the schema to your database
pnpm db:push

# Or generate and run migrations
pnpm db:generate
pnpm db:migrate
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the Keycloak login page.

---

## Keycloak Configuration

1. Create a new **Client** in your Keycloak realm
2. Set **Client Protocol** to `openid-connect`
3. Set **Access Type** to `confidential`
4. Add the following **Valid Redirect URIs**:
   - `http://localhost:3000/api/auth/callback/keycloak` (development)
   - `https://your-domain.com/api/auth/callback/keycloak` (production)
5. Copy the client secret from the **Credentials** tab into `KEYCLOAK_CLIENT_SECRET`

Set the corresponding environment variables:

```env
KEYCLOAK_URL=https://auth.example.com
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=kagi
KEYCLOAK_CLIENT_SECRET=<from credentials tab>
```

---

## Docker Deployment

A `Dockerfile` and `docker-compose.yml` are included for production deployment.

### Quick start with Docker Compose

```bash
# Copy and fill in environment variables
cp .env.example .env

# Build and start
docker compose up -d

# Check logs
docker compose logs -f app
```

The compose file starts:

- `db` — PostgreSQL 17
- `app` — Kagi application on port 3000

> **Note:** Run database migrations separately before or after first boot:
>
> ```bash
> docker compose run --rm app sh -c "npx drizzle-kit migrate"
> ```

### Environment variables for Docker

All variables from `.env.example` should be present in the `.env` file used by Docker Compose. The `POSTGRES_PASSWORD` variable sets the database password (default: `secret`).

---

## Project Structure

```
kagi/
├── app/
│   ├── (auth)/login/          # Keycloak login page
│   ├── (dashboard)/           # Auth-guarded dashboard
│   │   ├── page.tsx           # Overview / analytics
│   │   ├── keys/              # Key categories + entries
│   │   ├── 2fa/               # 2FA recovery tokens
│   │   └── ai-extract/        # AI .env generator
│   └── api/                   # REST API route handlers
│       ├── auth/[...all]/     # better-auth handler
│       ├── categories/        # Key category CRUD
│       ├── entries/           # Key entry CRUD + reveal
│       ├── 2fa/               # 2FA token CRUD + reveal
│       ├── upload/            # File upload (SSH / JSON)
│       ├── stats/             # Dashboard statistics
│       └── ai/extract/        # AI extraction endpoint
├── components/
│   ├── ai/                    # AI extractor + Monaco env preview
│   ├── auth/                  # Login form
│   ├── 2fa/                   # 2FA cards + dialogs
│   ├── dashboard/             # Stats, charts
│   ├── dialogs/               # Create/edit/delete dialogs
│   ├── keys/                  # Category + entry cards
│   ├── layout/                # Sidebar + site header
│   ├── providers/             # React Query + Toaster
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── auth/                  # better-auth server + client config
│   ├── db/                    # Drizzle schema + connection
│   ├── hooks/                 # React Query hooks
│   ├── api-helpers.ts         # withAuth(), requireSession()
│   └── encryption.ts          # AES-256-GCM utilities
├── types/
│   └── index.ts               # Shared TypeScript types
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Key Security Notes

- **Encryption key (`KAGI_ENCRYPTION_KEY`) must be backed up securely.** If lost, all stored keys are unrecoverable.
- Values are encrypted server-side before writing to the database and decrypted only on explicit reveal requests.
- The AI extraction endpoint sends only key _names_ and project _names_ to the OpenAI API — never the actual secret values.
- All API routes require an authenticated session (validated via `requireSession()`).

---

## Development Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm format       # Prettier format
pnpm db:push      # Push schema changes to DB (no migration files)
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Run pending migrations
pnpm db:studio    # Open Drizzle Studio (DB GUI)
```
