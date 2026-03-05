---
title: Keycloak Setup
description: Self-host Keycloak with Docker Compose and connect it to Kagi.
---

Kagi supports Keycloak as an optional OIDC provider. If you already run Keycloak, or prefer SSO over email/password, this guide walks through the setup.

## 1. Deploy Keycloak with Docker Compose

Create a `docker-compose.yml` (or add to your existing stack):

```yaml
volumes:
  postgres_data:
    driver: local

services:
  postgres:
    image: postgres:16
    container_name: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: <POSTGRES_PASSWORD>
    ports:
      - 5432:5432

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    container_name: keycloak
    depends_on:
      - postgres
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: <ADMIN_PASSWORD>

      KC_HOSTNAME: https://sso.example.com
      KC_PROXY: edge
      KC_HTTP_ENABLED: true
      KC_HTTP_PORT: 8080
      KC_HTTPS_PORT: 8843

      KC_FEATURES: preview
      KC_HEALTH_ENABLED: true
      KC_METRICS_ENABLED: true

      KC_DB: postgres
      KC_DB_URL_HOST: postgres
      KC_DB_URL_PORT: 5432
      KC_DB_URL_DATABASE: keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: <POSTGRES_PASSWORD>

    ports:
      - 10080:8080
      - 10443:8443
    command:
      - start
```

```bash
docker compose up -d
```

Keycloak will be available at `http://localhost:10080`. In production, put it behind a reverse proxy (nginx, Caddy, etc.) at `https://sso.example.com`.

## 2. Create a realm and client

1. Open the Keycloak Admin Console → `http://localhost:10080/admin`
2. Sign in with your bootstrap credentials
3. Create a new realm (e.g. `kagi`) — do **not** use the `master` realm in production
4. Inside the realm, go to **Clients → Create client**
   - **Client type**: OpenID Connect
   - **Client ID**: `kagi`
   - **Name**: Kagi
5. Enable **Client authentication** (confidential client)
6. Set **Valid redirect URIs**: `https://your-kagi-url/api/auth/callback/keycloak`
7. Save, then go to the **Credentials** tab and copy the **Client secret**

## 3. Create users

Go to **Users → Add user**, fill in the details, then set a password in the **Credentials** tab.

## 4. Configure Kagi

Add the following to `apps/kagi/.env`:

```bash
KEYCLOAK_URL=https://sso.example.com
KEYCLOAK_REALM=kagi
KEYCLOAK_CLIENT_ID=kagi
KEYCLOAK_CLIENT_SECRET=<client-secret-from-step-2>
```

When these variables are present, a **Sign in with Keycloak** button appears on the login page automatically.

## Notes

- Keycloak can run alongside other auth providers (email/password, Google, GitHub) — they are all independent.
- If you remove the Keycloak env vars, the button disappears and existing sessions remain valid.
