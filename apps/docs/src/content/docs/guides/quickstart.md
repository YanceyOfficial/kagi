---
title: Quick Start
description: Get Kagi running in 5 minutes.
---

This guide walks you through self-hosting Kagi and making your first API call.

## Prerequisites

- Docker + Docker Compose (or a PostgreSQL instance)
- Node.js 20+ and pnpm 9+
- A running Keycloak instance (for browser login)

## 1. Clone and configure

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

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=kagi
KEYCLOAK_CLIENT_SECRET=<client-secret>

# OpenAI (for AI extraction feature)
OPENAI_API_KEY=sk-...
```

## 2. Start the database

```bash
docker compose up -d postgres
```

Or point `DATABASE_URL` at an existing PostgreSQL instance.

## 3. Run migrations

```bash
pnpm --filter kagi db:push
```

## 4. Start the dev server

```bash
pnpm dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

## 5. Log in and create an access key

1. Open `http://localhost:3000` and sign in via Keycloak.
2. Go to **Settings → API Keys**.
3. Click **New API Key**, give it a name, select scopes, and click **Create**.
4. Copy the key — it is shown **only once**.

## 6. Make your first API call

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

## 7. Explore the OpenAPI spec

The full OpenAPI 3.1.0 spec is served at:

```
GET /api/openapi
```

You can import this URL directly into Postman, Insomnia, or any OpenAPI-compatible client.

## Next steps

- [Authentication: Access Keys](/authentication/access-keys/) — key format, scopes, expiry
- [API Reference](/api-reference/overview/) — complete endpoint documentation
- [AI Extraction](/api-reference/ai-extraction/) — generate `.env` files with AI
