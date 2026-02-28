import { buildFaviconUrl, extractDomain } from '@/lib/favicon'
import { describe, expect, it } from 'vitest'

const GSTATIC_BASE = 'https://t3.gstatic.com/faviconV2'

describe('buildFaviconUrl', () => {
  it('wraps a bare domain with Google favicon service', () => {
    const url = buildFaviconUrl('openai.com')
    expect(url).toContain(GSTATIC_BASE)
    expect(url).toContain(encodeURIComponent('https://openai.com'))
    expect(url).toContain('size=128')
  })

  it('preserves existing https:// prefix', () => {
    const url = buildFaviconUrl('https://stripe.com')
    expect(url).toContain(encodeURIComponent('https://stripe.com'))
    // Must not double-add protocol
    expect(url).not.toContain(encodeURIComponent('https://https://'))
  })

  it('preserves existing http:// prefix', () => {
    const url = buildFaviconUrl('http://example.com')
    expect(url).toContain(encodeURIComponent('http://example.com'))
  })

  it('adds https:// when no protocol given', () => {
    const url = buildFaviconUrl('github.com')
    expect(url).toContain(encodeURIComponent('https://github.com'))
  })

  it('returns a valid URL', () => {
    expect(() => new URL(buildFaviconUrl('aws.amazon.com'))).not.toThrow()
  })
})

describe('extractDomain', () => {
  it('extracts hostname from a stored Google favicon URL', () => {
    const stored = buildFaviconUrl('openai.com')
    expect(extractDomain(stored)).toBe('openai.com')
  })

  it('handles https:// input that was stored', () => {
    const stored = buildFaviconUrl('https://stripe.com')
    expect(extractDomain(stored)).toBe('stripe.com')
  })

  it('returns input as-is for non-favicon URLs', () => {
    const plain = 'https://cdn.example.com/logo.png'
    expect(extractDomain(plain)).toBe(plain)
  })

  it('returns input as-is for malformed strings', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url')
  })

  it('roundtrip: extractDomain(buildFaviconUrl(domain)) === domain', () => {
    const domains = ['github.com', 'amazonaws.com', 'google.com']
    for (const domain of domains) {
      expect(extractDomain(buildFaviconUrl(domain))).toBe(domain)
    }
  })
})
