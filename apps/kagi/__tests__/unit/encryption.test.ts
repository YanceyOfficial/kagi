import { decrypt, decryptJson, encrypt, encryptJson } from '@/lib/encryption'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const TEST_KEY = 'a'.repeat(64) // 32 bytes as 64 hex chars

beforeEach(() => {
  process.env.KAGI_ENCRYPTION_KEY = TEST_KEY
})

afterEach(() => {
  delete process.env.KAGI_ENCRYPTION_KEY
})

describe('encrypt / decrypt', () => {
  it('roundtrip: decrypt(encrypt(x)) === x', () => {
    const plain = 'super-secret-api-key-12345'
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it('handles empty string', () => {
    expect(decrypt(encrypt(''))).toBe('')
  })

  it('handles unicode and special characters', () => {
    const plain = '🔑 секрет & <script>alert(1)</script>'
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it('produces unique ciphertexts for the same plaintext (random IV)', () => {
    const plain = 'same-value'
    const c1 = encrypt(plain)
    const c2 = encrypt(plain)
    expect(c1).not.toBe(c2)
  })

  it('ciphertext has iv:authTag:data format (3 colon-separated parts)', () => {
    const parts = encrypt('hello').split(':')
    expect(parts).toHaveLength(3)
    // Each part should be non-empty base64
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0)
    }
  })

  it('throws on tampered ciphertext (GCM auth tag mismatch)', () => {
    const [iv, tag, data] = encrypt('original').split(':')
    // Flip one char in the ciphertext data
    const tampered = data.slice(0, -1) + (data.at(-1) === 'A' ? 'B' : 'A')
    expect(() => decrypt(`${iv}:${tag}:${tampered}`)).toThrow()
  })

  it('throws on wrong number of ciphertext parts', () => {
    expect(() => decrypt('onlyone')).toThrow('Invalid ciphertext format')
    expect(() => decrypt('a:b')).toThrow('Invalid ciphertext format')
    expect(() => decrypt('a:b:c:d')).toThrow('Invalid ciphertext format')
  })
})

describe('encryptJson / decryptJson', () => {
  it('roundtrip with object', () => {
    const obj = { AWS_ACCESS_KEY_ID: 'AKIA123', AWS_SECRET: 'secret' }
    expect(decryptJson(encryptJson(obj))).toEqual(obj)
  })

  it('roundtrip with array', () => {
    const tokens = ['token-a', 'token-b', 'token-c']
    expect(decryptJson(encryptJson(tokens))).toEqual(tokens)
  })

  it('roundtrip with nested structures', () => {
    const data = { nested: { key: 'value' }, arr: [1, 2, 3] }
    expect(decryptJson(encryptJson(data))).toEqual(data)
  })
})

describe('getMasterKey error handling', () => {
  it('throws when KAGI_ENCRYPTION_KEY is not set', () => {
    delete process.env.KAGI_ENCRYPTION_KEY
    expect(() => encrypt('test')).toThrow('KAGI_ENCRYPTION_KEY environment variable is not set')
  })

  it('throws when key is wrong length', () => {
    process.env.KAGI_ENCRYPTION_KEY = 'tooshort'
    expect(() => encrypt('test')).toThrow('hex characters')
  })
})
