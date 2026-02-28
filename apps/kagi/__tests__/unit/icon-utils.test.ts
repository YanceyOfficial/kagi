import { isHexDark } from '@/lib/icon-utils'
import { describe, expect, it } from 'vitest'

describe('isHexDark', () => {
  it('black (#000000) is dark', () => {
    expect(isHexDark('000000')).toBe(true)
  })

  it('white (#ffffff) is not dark', () => {
    expect(isHexDark('ffffff')).toBe(false)
  })

  it('matrix green (78c749-ish) is not dark', () => {
    // oklch(0.78 0.27 142) ≈ #4ade80
    expect(isHexDark('4ade80')).toBe(false)
  })

  it('GitHub dark gray (#24292e) is dark', () => {
    expect(isHexDark('24292e')).toBe(true)
  })

  it('X/Twitter black (#000000) is dark', () => {
    expect(isHexDark('000000')).toBe(true)
  })

  it('OpenAI green (#10a37f) is not dark', () => {
    expect(isHexDark('10a37f')).toBe(false)
  })

  it('pure red (#ff0000) is dark — perceived luminance 0.299×255≈76 falls below threshold 80', () => {
    expect(isHexDark('ff0000')).toBe(true)
  })

  it('pure blue (#0000ff) is dark (low perceived luminance)', () => {
    expect(isHexDark('0000ff')).toBe(true)
  })

  it('dark navy (#1a1a2e) is dark', () => {
    expect(isHexDark('1a1a2e')).toBe(true)
  })

  it('bright yellow (#ffff00) is not dark', () => {
    expect(isHexDark('ffff00')).toBe(false)
  })
})
