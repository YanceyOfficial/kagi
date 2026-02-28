---
title: Two-Factor Tokens
description: API reference for 2FA token endpoints.
---

Two-factor tokens store encrypted TOTP secrets. The stored secret is never exposed in list or detail responses — use the `/reveal` endpoint to generate a live TOTP code.

## Schema

### TwoFactorToken

```json
{
  "id": "a1b2c3d4-1234-5678-abcd-ef0123456789",
  "userId": "user_abc123",
  "service": "GitHub",
  "accountName": "me@example.com",
  "notes": "Personal GitHub account",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

The `encryptedSecret` field is **never** included in responses.

---

## List 2FA tokens

```http
GET /api/2fa
```

**Required scope:** `2fa:read`

Returns all 2FA tokens owned by the authenticated user.

### Response

```http
HTTP/1.1 200 OK

[
  {
    "id": "a1b2c3d4-...",
    "userId": "user_abc123",
    "service": "GitHub",
    "accountName": "me@example.com",
    "notes": "Personal GitHub account",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

## Create a 2FA token

```http
POST /api/2fa
Content-Type: application/json
```

**Required scope:** `2fa:write`

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service` | string | yes | Service name (e.g. "GitHub") |
| `accountName` | string | yes | Account identifier (e.g. email) |
| `secret` | string | yes | TOTP secret key (base32 encoded) |
| `notes` | string | no | Optional notes |

```json
{
  "service": "GitHub",
  "accountName": "me@example.com",
  "secret": "JBSWY3DPEHPK3PXP",
  "notes": "Personal GitHub account"
}
```

The `secret` is encrypted with AES-256-GCM before being stored.

### Response

```http
HTTP/1.1 201 Created

{
  "id": "a1b2c3d4-...",
  "userId": "user_abc123",
  "service": "GitHub",
  "accountName": "me@example.com",
  "notes": "Personal GitHub account",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

---

## Update a 2FA token

```http
PUT /api/2fa/{id}
Content-Type: application/json
```

**Required scope:** `2fa:write`

All fields are optional. If `secret` is provided, it is re-encrypted.

```json
{
  "notes": "Updated notes"
}
```

### Response

```http
HTTP/1.1 200 OK

{
  "id": "a1b2c3d4-...",
  "service": "GitHub",
  "accountName": "me@example.com",
  "notes": "Updated notes",
  ...
}
```

---

## Delete a 2FA token

```http
DELETE /api/2fa/{id}
```

**Required scope:** `2fa:write`

### Response

```http
HTTP/1.1 204 No Content
```

---

## Reveal a TOTP code

```http
POST /api/2fa/{id}/reveal
```

**Required scope:** `2fa:reveal`

Decrypts the stored TOTP secret and generates the current 6-digit code.

### Response

```http
HTTP/1.1 200 OK

{
  "id": "a1b2c3d4-...",
  "service": "GitHub",
  "accountName": "me@example.com",
  "code": "482931",
  "remainingSeconds": 18
}
```

| Field | Description |
|-------|-------------|
| `code` | Current 6-digit TOTP code |
| `remainingSeconds` | Seconds until the code expires (TOTP period is 30 seconds) |

Returns **404** if the token does not exist, is not owned by the authenticated user, or cannot be decrypted.
