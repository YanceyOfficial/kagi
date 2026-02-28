---
title: Access Keys
description: API reference for access key management endpoints.
---

Access key management endpoints allow you to list, create, and revoke programmatic API keys. These endpoints require **session authentication** (cookie-based) — you cannot use an access key to manage other access keys.

## Schema

### AccessKey

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "deploy-script",
  "keyPrefix": "kagi_dGhp",
  "scopes": ["entries:read", "entries:reveal"],
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "lastUsedAt": "2026-02-01T08:30:00.000Z",
  "createdAt": "2026-01-15T10:00:00.000Z"
}
```

The raw key value and its hash are **never** returned after creation.

---

## List access keys

```http
GET /api/access-keys
```

**Auth:** Session required (browser login)

Returns all access keys owned by the authenticated user.

### Response

```http
HTTP/1.1 200 OK

[
  {
    "id": "3fa85f64-...",
    "name": "deploy-script",
    "keyPrefix": "kagi_dGhp",
    "scopes": ["entries:read", "entries:reveal"],
    "expiresAt": "2026-12-31T00:00:00.000Z",
    "lastUsedAt": "2026-02-01T08:30:00.000Z",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

## Create an access key

```http
POST /api/access-keys
Content-Type: application/json
```

**Auth:** Session required (browser login)

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Descriptive name (e.g. `"ci-pipeline"`) |
| `scopes` | string[] | yes | One or more [scopes](/authentication/scopes/) |
| `expiresAt` | ISO 8601 date | no | Expiry date. Omit for no expiry. |

Valid scope values: `categories:read`, `categories:write`, `entries:read`, `entries:write`, `entries:reveal`, `2fa:read`, `2fa:write`, `2fa:reveal`, `stats:read`, `export:read`, `ai:extract`.

```json
{
  "name": "deploy-script",
  "scopes": ["entries:read", "entries:reveal"],
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

### Response

```http
HTTP/1.1 201 Created

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "deploy-script",
  "keyPrefix": "kagi_dGhp",
  "scopes": ["entries:read", "entries:reveal"],
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "lastUsedAt": null,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "key": "kagi_dGhpcyBpcyBub3QgYSByZWFsIGtleQ"
}
```

The `key` field contains the full plaintext token. **This is the only time it is returned.** Copy it now and store it securely — it cannot be recovered.

---

## Revoke an access key

```http
DELETE /api/access-keys/{id}
```

**Auth:** Session required (browser login)

### Path parameters

| Parameter | Description |
|-----------|-------------|
| `id` | Access key UUID |

### Response

```http
HTTP/1.1 204 No Content
```

The key is immediately invalidated. Any in-flight requests using this key will receive a 401 after the deletion completes.

Returns **404** if the key does not exist or is not owned by the authenticated user.

---

## Why session-only?

Access key management endpoints intentionally reject Bearer token authentication. This prevents a compromised access key from being used to create new keys or cover its tracks by revoking other keys. Only a logged-in user (with a valid browser session) can manage keys.
