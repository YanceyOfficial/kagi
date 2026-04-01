---
title: Env Projects
description: Store and manage encrypted .env files organized by project.
---

Env Projects let you store encrypted `.env` files (`.env`, `.env.local`, `.env.production`, `.env.development`) organized by project.

## Schema

```json
{
  "id": "uuid",
  "userId": "user_abc123",
  "name": "Blog Project",
  "description": "Next.js blog environment files",
  "fileCount": 3,
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-01-15T00:00:00.000Z"
}
```

## List projects

```http
GET /api/envs
Authorization: Bearer kagi_<your-key>
```

**Scope:** `envs:read`

**Query parameters:**

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| `search`  | string | Filter by name   |

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Blog Project",
      "description": "...",
      "fileCount": 3,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

## Create project

```http
POST /api/envs
Authorization: Bearer kagi_<your-key>
Content-Type: application/json

{
  "name": "Blog Project",
  "description": "Next.js blog environment files"
}
```

**Scope:** `envs:write`

**Response:** `201 Created`

## Get project with files

```http
GET /api/envs/{id}
Authorization: Bearer kagi_<your-key>
```

**Scope:** `envs:read`

Returns the project metadata plus a list of its files (without content).

## Update project

```http
PUT /api/envs/{id}
Authorization: Bearer kagi_<your-key>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Scope:** `envs:write`

## Delete project

```http
DELETE /api/envs/{id}
Authorization: Bearer kagi_<your-key>
```

**Scope:** `envs:write`

Cascade-deletes all files in the project.

## Save / upsert file

```http
POST /api/envs/{id}/files
Authorization: Bearer kagi_<your-key>
Content-Type: application/json

{
  "fileType": "env",
  "content": "DATABASE_URL=postgresql://...\nAPI_KEY=sk-..."
}
```

**Scope:** `envs:write`

| `fileType` values     |
| --------------------- |
| `env`                 |
| `env.local`           |
| `env.production`      |
| `env.development`     |

If a file with the same `fileType` already exists in the project, it is updated (upsert).

## Delete file

```http
DELETE /api/envs/{id}/files/{fileId}
Authorization: Bearer kagi_<your-key>
```

**Scope:** `envs:write`

## Reveal file content

```http
POST /api/envs/{id}/files/{fileId}/reveal
Authorization: Bearer kagi_<your-key>
```

**Scope:** `envs:reveal`

**Response:** `200 OK`

```json
{
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "fileType": "env",
    "content": "DATABASE_URL=postgresql://...\nAPI_KEY=sk-..."
  }
}
```

File content is decrypted server-side and returned as a plaintext string.
