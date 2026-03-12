---
title: Quick Start
description: Get Kagi running in 5 minutes.
---

This guide walks you through self-hosting Kagi and making your first API call.

## Prerequisites

- Docker + Docker Compose

## 1. Choose an auth method

Kagi supports two login methods — pick one.

### Option A — Email / password

The simplest option, no external dependencies required.

```bash
ENABLE_EMAIL_PASSWORD=true
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<your-password>
```

On first startup, Kagi automatically creates the admin account from these values.

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

# OpenAI (optional — for AI extraction feature)
OPENAI_API_KEY=sk-...
```

## 3. Start with Docker Compose

### Option A — Prebuilt image (recommended)

```bash
docker compose up -d
```

The `docker-compose.yml` uses `yanceyofficial/kagi:latest` by default — no build step needed.

### Option B — Build from source

Clone the repo, edit `docker-compose.yml` to swap the image for a local build:

```bash
git clone https://github.com/YanceyOfficial/kagi.git
cd kagi/apps/kagi
```

In `docker-compose.yml`, comment out `image:` and uncomment the `build:` block:

```yaml
app:
  # image: yanceyofficial/kagi:latest   # ← comment this out
  build:
    context: .
    dockerfile: Dockerfile
```

Then start:

```bash
docker compose up -d --build
```

## 4. Database migrations

Migrations run automatically via the `migrate` service in `docker-compose.yml` before the app starts. You don't need to do anything manually.

When you pull a new image, the same flow applies — just restart:

```bash
docker compose pull
docker compose up -d
```

Docker Compose will re-run the `migrate` service, apply any new migrations, then start the app.

The app is now running at [http://localhost:3000](http://localhost:3000).

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
