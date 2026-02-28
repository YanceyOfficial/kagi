---
title: Categories
description: API reference for key category endpoints.
---

Categories define the *type* and *format* of a key (e.g. "OpenAI API", "AWS Credentials"). Each category has a key type that determines how its entries are stored and displayed.

## Schemas

### KeyCategory

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "user_abc123",
  "name": "OpenAI API",
  "keyType": "simple",
  "envVarName": "OPENAI_API_KEY",
  "icon": "openai",
  "description": "OpenAI API key for GPT models",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### KeyType

| Value | Description |
|-------|-------------|
| `simple` | Single environment variable (string) |
| `group` | Multiple named fields (e.g. AWS access key + secret) |
| `ssh` | SSH private key file content |
| `json` | JSON credential file (e.g. GCP service account) |

---

## List categories

```http
GET /api/categories
```

**Required scope:** `categories:read`

Returns all categories owned by the authenticated user.

### Response

```http
HTTP/1.1 200 OK

[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "user_abc123",
    "name": "OpenAI API",
    "keyType": "simple",
    "envVarName": "OPENAI_API_KEY",
    "icon": "openai",
    "description": "OpenAI API key for GPT models",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## Create a category

```http
POST /api/categories
Content-Type: application/json
```

**Required scope:** `categories:write`

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Display name (e.g. "OpenAI API") |
| `keyType` | `simple` \| `group` \| `ssh` \| `json` | yes | Key type |
| `envVarName` | string | yes for `simple` | Environment variable name |
| `icon` | string | no | Simple Icons slug (e.g. `"openai"`) |
| `description` | string | no | Optional description |

```json
{
  "name": "OpenAI API",
  "keyType": "simple",
  "envVarName": "OPENAI_API_KEY",
  "icon": "openai",
  "description": "OpenAI API key for GPT models"
}
```

### Response

```http
HTTP/1.1 201 Created

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "user_abc123",
  "name": "OpenAI API",
  "keyType": "simple",
  "envVarName": "OPENAI_API_KEY",
  "icon": "openai",
  "description": "OpenAI API key for GPT models",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

---

## Get a category

```http
GET /api/categories/{id}
```

**Required scope:** `categories:read`

### Path parameters

| Parameter | Description |
|-----------|-------------|
| `id` | Category UUID |

### Response

```http
HTTP/1.1 200 OK

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "OpenAI API",
  ...
}
```

Returns **404** if the category does not exist or is not owned by the authenticated user.

---

## Update a category

```http
PUT /api/categories/{id}
Content-Type: application/json
```

**Required scope:** `categories:write`

### Request body

All fields are optional — include only the fields you want to update.

```json
{
  "name": "OpenAI API (Production)",
  "description": "Production OpenAI key"
}
```

### Response

```http
HTTP/1.1 200 OK

{
  "id": "3fa85f64-...",
  "name": "OpenAI API (Production)",
  ...
}
```

---

## Delete a category

```http
DELETE /api/categories/{id}
```

**Required scope:** `categories:write`

Deletes the category and **all entries** under it (cascade delete).

### Response

```http
HTTP/1.1 204 No Content
```

Returns **404** if the category does not exist or is not owned by the authenticated user.
