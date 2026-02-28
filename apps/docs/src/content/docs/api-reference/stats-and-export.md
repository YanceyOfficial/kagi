---
title: Stats & Export
description: API reference for the stats and export endpoints.
---

## Stats

```http
GET /api/stats
```

**Required scope:** `stats:read`

Returns aggregate statistics about the authenticated user's data.

### Response

```http
HTTP/1.1 200 OK

{
  "totalCategories": 12,
  "totalEntries": 47,
  "total2fa": 8,
  "byKeyType": {
    "simple": 30,
    "group": 10,
    "ssh": 4,
    "json": 3
  },
  "byEnvironment": {
    "development": 15,
    "staging": 10,
    "production": 22
  }
}
```

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `totalCategories` | number | Number of key categories |
| `totalEntries` | number | Total number of key entries |
| `total2fa` | number | Number of 2FA tokens |
| `byKeyType` | object | Entry count broken down by key type |
| `byEnvironment` | object | Entry count broken down by environment |

---

## Export

```http
GET /api/export
```

**Required scope:** `export:read`

Exports **all** entries as a single `.env`-formatted text file. All values are decrypted on the server and included in the output.

### Response

```http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="kagi-export.env"

# OpenAI API — Blog Project (production)
OPENAI_API_KEY=sk-abc123...

# AWS Credentials — My AWS Account (production)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# ...
```

:::caution
This endpoint decrypts and returns **all secret values** in plaintext. Use it with care:

- Require the `export:read` scope explicitly — do not grant it by default.
- Store the exported file securely and delete it when no longer needed.
- Consider scoping access keys so that only trusted automation has this scope.
:::

### Format

- Each entry is preceded by a comment line: `# <category name> — <entry name> (<environment>)`
- `simple` entries: `ENV_VAR_NAME=value`
- `group` entries: each field is emitted as a separate `KEY=value` line
- `ssh` and `json` entries: skipped (cannot be expressed as env vars)
