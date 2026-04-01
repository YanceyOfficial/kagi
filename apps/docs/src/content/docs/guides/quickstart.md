---
title: Quick Start
description: Get Kagi running in 5 minutes.
---

:::tip[Quick links]
[`docker-compose.yml`](https://github.com/YanceyOfficial/kagi/blob/master/apps/kagi/docker-compose.yml) · [`.env.example`](https://github.com/YanceyOfficial/kagi/blob/master/apps/kagi/.env.example)
:::

This guide walks you through self-hosting Kagi and making your first API call.

## Prerequisites

- Docker + Docker Compose

## 1. Choose an auth method

Kagi supports two login methods — pick one or both.

### Option A — Email / password

The simplest option, no external dependencies required. An admin account is created automatically on first startup.

```bash
ENABLE_EMAIL_PASSWORD=true
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your-password
```

### Option B — Keycloak (SSO)

For teams or when you already run Keycloak. See [Keycloak Setup](/guides/keycloak/) for a full Docker Compose walkthrough.

```bash
KEYCLOAK_URL=https://sso.example.com
KEYCLOAK_REALM=kagi
KEYCLOAK_CLIENT_ID=kagi
KEYCLOAK_CLIENT_SECRET=<client-secret>
```

Set the Keycloak client's redirect URI to `https://your-kagi-url/api/auth/callback/keycloak`.

---

## 2. Configure environment variables

Create an `.env` file in the same directory as `docker-compose.yml`:

```bash
# Database — auto-managed by Docker Compose
POSTGRES_PASSWORD=secret

# Encryption — generate with: openssl rand -hex 32
KAGI_ENCRYPTION_KEY=<64-hex-chars>

# better-auth
BETTER_AUTH_SECRET=<random-string>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth — pick one or both from step 1
ENABLE_EMAIL_PASSWORD=true
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<your-password>

# Keycloak (optional — see step 1)
# KEYCLOAK_URL=https://sso.example.com
# KEYCLOAK_REALM=kagi
# KEYCLOAK_CLIENT_ID=kagi
# KEYCLOAK_CLIENT_SECRET=<client-secret>

# OpenAI (optional — for AI extraction feature)
# OPENAI_API_KEY=sk-...
```

## 3. Start with Docker Compose

```bash
docker compose pull
docker compose up -d
```

The prebuilt image `yanceyofficial/kagi:latest` is pulled from Docker Hub — no build step needed. Database migrations run automatically on startup before the app begins serving requests.

The app is now running at [http://localhost:3000](http://localhost:3000).

## 4. Upgrading

```bash
docker compose pull
docker compose up -d
```

New migrations are applied automatically on every startup.

## 5. Log in and create an access key

1. Open `http://localhost:3000` and sign in.
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

Import this URL directly into Postman, Insomnia, or any OpenAPI-compatible client.

## Next steps

- [Keycloak Setup](/guides/keycloak/) — self-host Keycloak with Docker Compose
- [Authentication: Access Keys](/authentication/access-keys/) — key format, scopes, expiry
- [API Reference](/api-reference/overview/) — complete endpoint documentation
- [AI Extraction](/api-reference/ai-extraction/) — generate `.env` files with AI
