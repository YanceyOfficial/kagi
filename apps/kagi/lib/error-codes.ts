/**
 * Machine-readable error codes returned by every API error response.
 * Each code maps to a unique, stable string that clients can reference
 * in the documentation (see /api-reference/errors).
 *
 * Response shape when an error occurs:
 *   { "error": "Human-readable message", "code": "ERROR_CODE" }
 */
export const ErrorCode = {
  // ── Authentication ──────────────────────────────────────────────────────────
  /** No session cookie and no Bearer token provided. */
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  /** Bearer token does not match any active access key, or the key has expired. */
  AUTH_INVALID_KEY: 'AUTH_INVALID_KEY',
  /** Access key exists but lacks the required scope for this endpoint. */
  AUTH_SCOPE_REQUIRED: 'AUTH_SCOPE_REQUIRED',

  // ── Input Validation ────────────────────────────────────────────────────────
  /** Request body failed schema validation (Zod). */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // ── Key Categories ──────────────────────────────────────────────────────────
  /** The requested category does not exist or is not owned by the caller. */
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  /** `keyType` is `simple` but `envVarName` was not provided. */
  CATEGORY_SIMPLE_REQUIRES_ENV_VAR: 'CATEGORY_SIMPLE_REQUIRES_ENV_VAR',
  /** `keyType` is `group` but `fieldDefinitions` was not provided or is empty. */
  CATEGORY_GROUP_REQUIRES_FIELDS: 'CATEGORY_GROUP_REQUIRES_FIELDS',

  // ── Key Entries ─────────────────────────────────────────────────────────────
  /** The requested entry does not exist or is not owned by the caller. */
  ENTRY_NOT_FOUND: 'ENTRY_NOT_FOUND',

  // ── 2FA Tokens ──────────────────────────────────────────────────────────────
  /** The requested 2FA token set does not exist or is not owned by the caller. */
  TWO_FACTOR_NOT_FOUND: 'TWO_FACTOR_NOT_FOUND',

  // ── Access Keys ─────────────────────────────────────────────────────────────
  /** The requested access key does not exist or is not owned by the caller. */
  ACCESS_KEY_NOT_FOUND: 'ACCESS_KEY_NOT_FOUND',

  // ── Env Manager ─────────────────────────────────────────────────────────────
  /** The requested env project does not exist or is not owned by the caller. */
  ENV_PROJECT_NOT_FOUND: 'ENV_PROJECT_NOT_FOUND',
  /** The requested env file does not exist or is not owned by the caller. */
  ENV_FILE_NOT_FOUND: 'ENV_FILE_NOT_FOUND',

  // ── File Upload ─────────────────────────────────────────────────────────────
  /** The multipart form did not contain a `file` field. */
  UPLOAD_NO_FILE: 'UPLOAD_NO_FILE',
  /** Uploaded file exceeds the 1 MB size limit. */
  UPLOAD_FILE_TOO_LARGE: 'UPLOAD_FILE_TOO_LARGE',
  /** Uploaded file MIME type is not in the allow-list. */
  UPLOAD_INVALID_TYPE: 'UPLOAD_INVALID_TYPE',

  // ── AI Extraction ───────────────────────────────────────────────────────────
  /** AI extraction request failed (model error or invalid prompt). */
  AI_EXTRACTION_FAILED: 'AI_EXTRACTION_FAILED',

  // ── Internal ────────────────────────────────────────────────────────────────
  /** Unexpected server-side error. Check server logs for details. */
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
