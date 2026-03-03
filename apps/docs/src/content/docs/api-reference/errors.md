---
title: Error Codes
description: Complete reference of machine-readable error codes returned by the Kagi API.
---

Every error response includes a `code` field alongside the human-readable `error` message:

```json
{
  "error": "Category not found",
  "code": "CATEGORY_NOT_FOUND"
}
```

Use `code` for programmatic error handling. Use `error` for display to end users.

---

## Authentication

| Code                  | HTTP | Description                                                                                                        |
| --------------------- | ---- | ------------------------------------------------------------------------------------------------------------------ |
| `AUTH_REQUIRED`       | 401  | No session cookie and no Bearer token was provided.                                                                |
| `AUTH_INVALID_KEY`    | 401  | The Bearer token does not match any active access key, or the key has expired.                                     |
| `AUTH_SCOPE_REQUIRED` | 403  | The access key exists but lacks the required scope for this endpoint. The `error` message names the missing scope. |

---

## Input Validation

| Code               | HTTP | Description                                                                                          |
| ------------------ | ---- | ---------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` | 400  | The request body failed schema validation. The `error` message describes which field failed and why. |

---

## Key Categories

| Code                               | HTTP | Description                                                                      |
| ---------------------------------- | ---- | -------------------------------------------------------------------------------- |
| `CATEGORY_NOT_FOUND`               | 404  | The requested category does not exist or is not owned by the authenticated user. |
| `CATEGORY_SIMPLE_REQUIRES_ENV_VAR` | 400  | `keyType` is `simple` but `envVarName` was not provided.                         |
| `CATEGORY_GROUP_REQUIRES_FIELDS`   | 400  | `keyType` is `group` but `fieldDefinitions` was not provided or is empty.        |

---

## Key Entries

| Code              | HTTP | Description                                                                   |
| ----------------- | ---- | ----------------------------------------------------------------------------- |
| `ENTRY_NOT_FOUND` | 404  | The requested entry does not exist or is not owned by the authenticated user. |

---

## 2FA Tokens

| Code                   | HTTP | Description                                                                           |
| ---------------------- | ---- | ------------------------------------------------------------------------------------- |
| `TWO_FACTOR_NOT_FOUND` | 404  | The requested 2FA token set does not exist or is not owned by the authenticated user. |

---

## Access Keys

| Code                   | HTTP | Description                                                                        |
| ---------------------- | ---- | ---------------------------------------------------------------------------------- |
| `ACCESS_KEY_NOT_FOUND` | 404  | The requested access key does not exist or is not owned by the authenticated user. |

---

## Env Manager

| Code                    | HTTP | Description                                                                         |
| ----------------------- | ---- | ----------------------------------------------------------------------------------- |
| `ENV_PROJECT_NOT_FOUND` | 404  | The requested env project does not exist or is not owned by the authenticated user. |
| `ENV_FILE_NOT_FOUND`    | 404  | The requested env file does not exist or is not owned by the authenticated user.    |

---

## File Upload

| Code                    | HTTP | Description                                                                                                                                  |
| ----------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `UPLOAD_NO_FILE`        | 400  | The multipart form request did not contain a `file` field.                                                                                   |
| `UPLOAD_FILE_TOO_LARGE` | 400  | The uploaded file exceeds the 1 MB size limit.                                                                                               |
| `UPLOAD_INVALID_TYPE`   | 400  | The uploaded file's MIME type is not in the allow-list (`text/*`, `application/json`, `application/x-pem-file`, `application/octet-stream`). |

---

## AI Extraction

| Code                   | HTTP | Description                                                                       |
| ---------------------- | ---- | --------------------------------------------------------------------------------- |
| `AI_EXTRACTION_FAILED` | 500  | The AI extraction request failed due to a model error or an unprocessable prompt. |

---

## Internal

| Code             | HTTP | Description                                                                  |
| ---------------- | ---- | ---------------------------------------------------------------------------- |
| `INTERNAL_ERROR` | 500  | An unexpected server-side error occurred. Check the server logs for details. |

---

## Handling errors in code

```typescript
const res = await fetch('/api/entries/abc', {
  headers: { Authorization: `Bearer ${key}` }
})

if (!res.ok) {
  const { error, code } = await res.json()

  switch (code) {
    case 'AUTH_REQUIRED':
    case 'AUTH_INVALID_KEY':
      // redirect to login
      break
    case 'AUTH_SCOPE_REQUIRED':
      // show "insufficient permissions" UI
      break
    case 'ENTRY_NOT_FOUND':
      // show 404 state
      break
    default:
      console.error(`[${code}] ${error}`)
  }
}
```
