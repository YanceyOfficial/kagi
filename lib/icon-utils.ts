/**
 * Returns true if a 6-char hex color string is too dark to be visible
 * on a dark background (uses perceived luminance weighting).
 */
export function isHexDark(hex: string): boolean {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b < 80
}
