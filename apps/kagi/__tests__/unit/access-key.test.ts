import {
  ACCESS_KEY_PREFIX,
  ALL_SCOPES,
  SCOPE_DESCRIPTIONS,
  generateAccessKey,
  hashAccessKey
} from '@/lib/access-key'
import { describe, expect, it } from 'vitest'

describe('ACCESS_KEY_PREFIX', () => {
  it('is "kagi_"', () => {
    expect(ACCESS_KEY_PREFIX).toBe('kagi_')
  })
})

describe('ALL_SCOPES', () => {
  it('contains exactly 11 scopes', () => {
    expect(ALL_SCOPES).toHaveLength(11)
  })

  it('contains every expected scope', () => {
    const expected = [
      'categories:read',
      'categories:write',
      'entries:read',
      'entries:write',
      'entries:reveal',
      '2fa:read',
      '2fa:write',
      '2fa:reveal',
      'stats:read',
      'export:read',
      'ai:extract'
    ]
    for (const scope of expected) {
      expect(ALL_SCOPES).toContain(scope)
    }
  })
})

describe('SCOPE_DESCRIPTIONS', () => {
  it('has a description for every scope in ALL_SCOPES', () => {
    for (const scope of ALL_SCOPES) {
      expect(SCOPE_DESCRIPTIONS[scope]).toBeDefined()
      expect(typeof SCOPE_DESCRIPTIONS[scope]).toBe('string')
      expect(SCOPE_DESCRIPTIONS[scope].length).toBeGreaterThan(0)
    }
  })
})

describe('generateAccessKey', () => {
  it('key starts with the kagi_ prefix', () => {
    const { key } = generateAccessKey()
    expect(key.startsWith('kagi_')).toBe(true)
  })

  it('key has correct total length (5 + 43 = 48 chars for base64url of 32 bytes)', () => {
    const { key } = generateAccessKey()
    // randomBytes(32).toString('base64url') → 43 chars, plus 'kagi_' (5)
    expect(key.length).toBe(48)
  })

  it('key only contains URL-safe characters', () => {
    const { key } = generateAccessKey()
    expect(/^kagi_[A-Za-z0-9_-]+$/.test(key)).toBe(true)
  })

  it('keyPrefix starts with "kagi_" and is 13 chars (5 + 8)', () => {
    const { keyPrefix } = generateAccessKey()
    expect(keyPrefix.startsWith('kagi_')).toBe(true)
    expect(keyPrefix.length).toBe(13)
  })

  it('keyPrefix is a prefix of key', () => {
    const { key, keyPrefix } = generateAccessKey()
    expect(key.startsWith(keyPrefix)).toBe(true)
  })

  it('hash is a 64-char hex string (SHA-256)', () => {
    const { hash } = generateAccessKey()
    expect(hash).toHaveLength(64)
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true)
  })

  it('hash matches hashAccessKey(key)', () => {
    const { key, hash } = generateAccessKey()
    expect(hashAccessKey(key)).toBe(hash)
  })

  it('produces unique keys on every call', () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateAccessKey().key))
    expect(keys.size).toBe(20)
  })

  it('produces unique hashes on every call', () => {
    const hashes = new Set(Array.from({ length: 20 }, () => generateAccessKey().hash))
    expect(hashes.size).toBe(20)
  })
})

describe('hashAccessKey', () => {
  it('is deterministic — same input always produces same output', () => {
    const key = 'kagi_testkey123'
    expect(hashAccessKey(key)).toBe(hashAccessKey(key))
  })

  it('produces a 64-char lowercase hex string', () => {
    const hash = hashAccessKey('kagi_example')
    expect(hash).toHaveLength(64)
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true)
  })

  it('different inputs produce different hashes', () => {
    const h1 = hashAccessKey('kagi_aaaa')
    const h2 = hashAccessKey('kagi_bbbb')
    expect(h1).not.toBe(h2)
  })

  it('is sensitive to every character', () => {
    const base = hashAccessKey('kagi_abc')
    expect(hashAccessKey('kagi_abd')).not.toBe(base)
    expect(hashAccessKey('Kagi_abc')).not.toBe(base)
  })
})
