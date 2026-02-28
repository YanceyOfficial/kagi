/**
 * AES-256-GCM encryption utilities for storing private keys securely.
 *
 * Encrypted format: "iv:authTag:ciphertext" (all base64-encoded)
 *
 * The master key is loaded from KAGI_ENCRYPTION_KEY (64 hex chars = 32 bytes).
 * Generate a key with: openssl rand -hex 32
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32 // 256-bit key
const IV_BYTES = 12 // 96-bit IV — recommended for GCM

function getMasterKey(): Buffer {
  const hex = process.env.KAGI_ENCRYPTION_KEY
  if (!hex) {
    throw new Error('KAGI_ENCRYPTION_KEY environment variable is not set')
  }
  const key = Buffer.from(hex, 'hex')
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `KAGI_ENCRYPTION_KEY must be exactly ${KEY_BYTES * 2} hex characters (${KEY_BYTES} bytes)`
    )
  }
  return key
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a single string: "iv:authTag:ciphertext" (all base64).
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey()
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])

  const authTag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':')
}

/**
 * Decrypts a ciphertext string produced by `encrypt`.
 * Throws if the ciphertext is tampered (GCM authentication failure).
 */
export function decrypt(ciphertext: string): string {
  const key = getMasterKey()
  const parts = ciphertext.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format — expected "iv:authTag:data"')
  }

  const [ivB64, authTagB64, encryptedB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}

/**
 * Encrypts a JSON-serialisable object.
 * Convenience wrapper used for 'group' key entries and 2FA token arrays.
 */
export function encryptJson<T>(value: T): string {
  return encrypt(JSON.stringify(value))
}

/**
 * Decrypts and JSON-parses a value produced by `encryptJson`.
 */
export function decryptJson<T>(ciphertext: string): T {
  return JSON.parse(decrypt(ciphertext)) as T
}
