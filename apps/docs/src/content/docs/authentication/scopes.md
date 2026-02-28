---
title: Scopes
description: Fine-grained permission scopes for Kagi access keys.
---

Every access key carries a set of **scopes** that limit what the key can do. Grant only what is needed.

Browser sessions (cookie-based login) always have full access and are not subject to scope restrictions.

## Available scopes

| Scope | Description |
|-------|-------------|
| `categories:read` | List and view key categories |
| `categories:write` | Create, update, and delete categories |
| `entries:read` | List and view entries (without values) |
| `entries:write` | Create, update, and delete entries |
| `entries:reveal` | Decrypt and reveal entry values |
| `2fa:read` | List and view 2FA tokens (without TOTP codes) |
| `2fa:write` | Create, update, and delete 2FA tokens |
| `2fa:reveal` | Generate live TOTP codes from stored secrets |
| `stats:read` | Read dashboard statistics |
| `export:read` | Export all entries as a `.env` file |
| `ai:extract` | Use AI extraction to generate `.env` snippets |

## Scope mapping to endpoints

| Endpoint | Method | Required scope |
|----------|--------|---------------|
| `/api/categories` | GET | `categories:read` |
| `/api/categories` | POST | `categories:write` |
| `/api/categories/{id}` | GET | `categories:read` |
| `/api/categories/{id}` | PUT | `categories:write` |
| `/api/categories/{id}` | DELETE | `categories:write` |
| `/api/entries` | GET | `entries:read` |
| `/api/entries` | POST | `entries:write` |
| `/api/entries/{id}` | GET | `entries:read` |
| `/api/entries/{id}` | PUT | `entries:write` |
| `/api/entries/{id}` | DELETE | `entries:write` |
| `/api/entries/{id}/reveal` | POST | `entries:reveal` |
| `/api/2fa` | GET | `2fa:read` |
| `/api/2fa` | POST | `2fa:write` |
| `/api/2fa/{id}` | PUT | `2fa:write` |
| `/api/2fa/{id}` | DELETE | `2fa:write` |
| `/api/2fa/{id}/reveal` | POST | `2fa:reveal` |
| `/api/stats` | GET | `stats:read` |
| `/api/export` | GET | `export:read` |
| `/api/ai/extract` | POST | `ai:extract` |
| `/api/access-keys` | GET, POST | *(session auth only)* |
| `/api/access-keys/{id}` | DELETE | *(session auth only)* |
| `/api/openapi` | GET | *(public, no auth)* |

:::note
Access key management endpoints (`/api/access-keys`) require **session authentication** — you cannot use an access key to create or revoke other access keys. This prevents privilege escalation.
:::

## Recommended scope sets

### Read-only automation (e.g., deployment scripts that only read secrets)

```json
["entries:read", "entries:reveal"]
```

### CI/CD pipeline that also generates `.env` files

```json
["categories:read", "entries:read", "entries:reveal", "ai:extract"]
```

### Full API access (admin-equivalent, no key management)

```json
[
  "categories:read", "categories:write",
  "entries:read", "entries:write", "entries:reveal",
  "2fa:read", "2fa:write", "2fa:reveal",
  "stats:read", "export:read", "ai:extract"
]
```

## Error responses

When a key lacks the required scope, the API returns:

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Forbidden"
}
```

A missing or invalid key returns:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized"
}
```
