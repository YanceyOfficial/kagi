---
title: Entries
description: API reference for key entry endpoints.
---

Entries are per-project instances of a category (e.g., "OpenAI API for Blog Project"). Each entry stores an encrypted value whose format depends on the parent category's `keyType`.

## Schemas

### KeyEntry

```json
{
  "id": "7b3c9e12-1234-5678-abcd-ef0123456789",
  "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Blog Project",
  "environment": "production",
  "notes": "Used for the main blog site",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

Note: `encryptedValue` is **never** included in responses. Use the `/reveal` endpoint to decrypt.

### Environment

| Value | Description |
|-------|-------------|
| `development` | Dev environment |
| `staging` | Staging environment |
| `production` | Production environment |

### Value formats by KeyType

| KeyType | Value format |
|---------|-------------|
| `simple` | Plain string (e.g., `"sk-abc123"`) |
| `group` | JSON object of field name → value pairs |
| `ssh` | PEM-encoded private key string |
| `json` | JSON credential object (stringified) |

---

## List entries

```http
GET /api/entries
```

**Required scope:** `entries:read`

Returns all entries owned by the authenticated user, joined with their category metadata. Does **not** return encrypted values.

### Response

```http
HTTP/1.1 200 OK

[
  {
    "id": "7b3c9e12-...",
    "categoryId": "3fa85f64-...",
    "name": "Blog Project",
    "environment": "production",
    "notes": "Used for the main blog site",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z",
    "category": {
      "name": "OpenAI API",
      "keyType": "simple",
      "envVarName": "OPENAI_API_KEY",
      "icon": "openai"
    }
  }
]
```

---

## Create an entry

```http
POST /api/entries
Content-Type: application/json
```

**Required scope:** `entries:write`

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `categoryId` | UUID | yes | Parent category ID |
| `name` | string | yes | Project name (e.g. "Blog Project") |
| `value` | string | yes | Plaintext secret value (encrypted server-side) |
| `environment` | string | no | `development`, `staging`, or `production` |
| `notes` | string | no | Optional notes |

```json
{
  "categoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Blog Project",
  "value": "sk-abc123...",
  "environment": "production",
  "notes": "Used for the main blog site"
}
```

For `group` key types, `value` should be a JSON string:

```json
{
  "categoryId": "...",
  "name": "My AWS Account",
  "value": "{\"AWS_ACCESS_KEY_ID\":\"AKIA...\",\"AWS_SECRET_ACCESS_KEY\":\"...\"}"
}
```

### Response

```http
HTTP/1.1 201 Created

{
  "id": "7b3c9e12-...",
  "categoryId": "3fa85f64-...",
  "name": "Blog Project",
  "environment": "production",
  "notes": "Used for the main blog site",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

---

## Get an entry

```http
GET /api/entries/{id}
```

**Required scope:** `entries:read`

### Response

```http
HTTP/1.1 200 OK

{
  "id": "7b3c9e12-...",
  "categoryId": "3fa85f64-...",
  "name": "Blog Project",
  ...
}
```

Returns **404** if the entry does not exist or is not owned by the authenticated user.

---

## Update an entry

```http
PUT /api/entries/{id}
Content-Type: application/json
```

**Required scope:** `entries:write`

All fields are optional. If `value` is provided, it is re-encrypted and the stored ciphertext is replaced.

```json
{
  "name": "Blog Project (renamed)",
  "value": "sk-new-key...",
  "environment": "production"
}
```

### Response

```http
HTTP/1.1 200 OK

{
  "id": "7b3c9e12-...",
  "name": "Blog Project (renamed)",
  ...
}
```

---

## Delete an entry

```http
DELETE /api/entries/{id}
```

**Required scope:** `entries:write`

### Response

```http
HTTP/1.1 204 No Content
```

---

## Reveal an entry value

```http
POST /api/entries/{id}/reveal
```

**Required scope:** `entries:reveal`

Decrypts and returns the secret value. This is the only endpoint that exposes the plaintext value.

### Response

```http
HTTP/1.1 200 OK

{
  "id": "7b3c9e12-...",
  "name": "Blog Project",
  "value": "sk-abc123...",
  "environment": "production"
}
```

For `group` entries, `value` is an object:

```json
{
  "id": "...",
  "name": "My AWS Account",
  "value": {
    "AWS_ACCESS_KEY_ID": "AKIA...",
    "AWS_SECRET_ACCESS_KEY": "..."
  }
}
```

Returns **404** if the entry does not exist, is not owned by the authenticated user, or cannot be decrypted.
