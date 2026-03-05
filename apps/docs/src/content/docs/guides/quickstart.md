---
title: Quick Start
description: Get Kagi running in 5 minutes.
---

This guide walks you through self-hosting Kagi and making your first API call.

## Prerequisites

- Docker + Docker Compose (or a PostgreSQL instance)
- Node.js 20+ and pnpm 9+
- At least one auth provider configured (see step 1)

## 1. Choose an auth provider

Kagi supports multiple login methods. Configure at least one.

### Option A — Email / password (simplest, no external dependencies)

```bash
ENABLE_EMAIL_PASSWORD=true
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<your-password>
ADMIN_NAME=Admin          # optional
```

On first startup, Kagi automatically creates the admin account from these values.

### Option B — Google OAuth

```bash
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
```

Create credentials at [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.
Set the authorised redirect URI to `https://your-kagi-url/api/auth/callback/google`.

### Option C — GitHub OAuth

```bash
GITHUB_CLIENT_ID=<client-id>
GITHUB_CLIENT_SECRET=<client-secret>
```

Create an OAuth app at github.com → Settings → Developer settings → OAuth Apps.
Set the callback URL to `https://your-kagi-url/api/auth/callback/github`.

### Option D — Keycloak

```bash
KEYCLOAK_URL=https://sso.example.com
KEYCLOAK_REALM=kagi
KEYCLOAK_CLIENT_ID=kagi
KEYCLOAK_CLIENT_SECRET=<client-secret>
```

See [Keycloak Setup](/guides/keycloak/) for a full Docker Compose walkthrough.

---

Multiple options can be enabled simultaneously — the login page shows all configured providers.

## 2. Clone and configure

```bash
git clone https://github.com/YanceyOfficial/kagi.git
cd kagi
cp apps/kagi/.env.example apps/kagi/.env
```

Edit `apps/kagi/.env` and fill in the required values:

```bash
# Database
DATABASE_URL=postgresql://kagi:kagi@localhost:5432/kagi

# Encryption — generate with: openssl rand -hex 32
KAGI_ENCRYPTION_KEY=<64-hex-chars>

# better-auth
BETTER_AUTH_SECRET=<random-string>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth provider(s) — see step 1
ENABLE_EMAIL_PASSWORD=true
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<your-password>

# OpenAI (for AI extraction feature)
OPENAI_API_KEY=sk-...
```

## 3. Start the database

```bash
docker compose up -d postgres
```

Or point `DATABASE_URL` at an existing PostgreSQL instance.

## 4. Run migrations

```bash
pnpm --filter kagi db:push
```

## 5. Start the dev server

```bash
pnpm dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

## 6. Log in and create an access key

1. Open `http://localhost:3000` and sign in.
2. Go to **Settings → API Keys**.
3. Click **New API Key**, give it a name, select scopes, and click **Create**.
4. Copy the key — it is shown **only once**.

## 7. Make your first API call

```bash
# List your categories
curl -H "Authorization: Bearer kagi_<your-key>" \
  http://localhost:3000/api/categories
```

```bash
# Reveal an entry value
curl -X POST \
  -H "Authorization: Bearer kagi_<your-key>" \
  http://localhost:3000/api/entries/<entry-id>/reveal
```

## 8. Explore the OpenAPI spec

The full OpenAPI 3.1.0 spec is served at:

```
GET /api/openapi
```

You can import this URL directly into Postman, Insomnia, or any OpenAPI-compatible client.

## Next steps

- [Keycloak Setup](/guides/keycloak/) — self-host Keycloak with Docker Compose
- [Authentication: Access Keys](/authentication/access-keys/) — key format, scopes, expiry
- [API Reference](/api-reference/overview/) — complete endpoint documentation
- [AI Extraction](/api-reference/ai-extraction/) — generate `.env` files with AI
