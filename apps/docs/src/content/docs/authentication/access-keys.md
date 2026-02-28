---
title: Access Keys
description: Create and manage programmatic API keys for CI/CD and scripts.
---

Access keys let you authenticate with the Kagi API without a browser session. They are designed for scripts, CI/CD pipelines, and integrations.

## Key format

Every access key is a random token prefixed with `kagi_`:

```
kagi_<43-char-base64url>
```

Example:

```
kagi_dGhpcyBpcyBub3QgYSByZWFsIGtleQ
```

The prefix makes keys easy to identify in logs and grep output.

## How authentication works

Pass the key in the `Authorization` header as a Bearer token:

```http
Authorization: Bearer kagi_<your-key>
```

The server:

1. Detects the `kagi_` prefix and switches to access-key authentication.
2. Hashes the raw key with SHA-256.
3. Looks up the hash in `access_keys` — if not found, returns **401**.
4. Checks that the key is not expired — if expired, returns **401**.
5. Checks that the key has the scope required by the endpoint — if not, returns **403**.
6. Records `lastUsedAt` asynchronously (non-blocking).

Browser sessions (cookies) always have full access and bypass scope checks.

## Creating a key

### Via the web UI

1. Go to **Settings → API Keys**.
2. Click **New API Key**.
3. Enter a descriptive name (e.g., `ci-pipeline`, `deploy-script`).
4. Select the [scopes](/authentication/scopes/) the key needs.
5. Optionally set an expiry date.
6. Click **Create** and copy the key — **it is shown only once**.

### Via the API

```http
POST /api/access-keys
Authorization: Bearer kagi_<admin-key>
Content-Type: application/json

{
  "name": "deploy-script",
  "scopes": ["entries:read", "entries:reveal"],
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

Response (201):

```json
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

The `key` field in the response is the only time the plaintext token is returned. Store it securely.

## Listing keys

```http
GET /api/access-keys
Authorization: Bearer kagi_<admin-key>
```

Returns an array of keys for the authenticated user. The raw key value and its hash are **never** returned by this endpoint — only metadata.

```json
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

## Revoking a key

```http
DELETE /api/access-keys/{id}
Authorization: Bearer kagi_<admin-key>
```

Returns **204 No Content** on success. The key is immediately invalidated.

## Security considerations

- **Treat access keys like passwords.** Do not commit them to source control.
- Use environment variables or a secrets manager (like Kagi itself) to store keys.
- Grant only the minimum [scopes](/authentication/scopes/) needed.
- Set an expiry date for keys used in temporary or one-off contexts.
- Rotate keys regularly. Revoke any key you suspect has been compromised.
- The `keyPrefix` field (e.g., `kagi_dGhp`) helps you identify which key is in use from logs without exposing the full token.

## Key storage

Kagi stores only the **SHA-256 hash** of the raw key. There is no way to recover a lost key — you must revoke and recreate it.
