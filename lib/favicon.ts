/**
 * Build a Google favicon service URL from a user-supplied domain or URL.
 * The user only needs to enter e.g. "openai.com" — we handle the rest.
 */
export function buildFaviconUrl(input: string): string {
  const url = input.startsWith('http') ? input : `https://${input}`
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`
}

/**
 * When editing a category, extract the original domain from a stored
 * Google favicon URL so the field shows a clean domain to the user.
 * Falls back to returning the input as-is for any other URL format.
 */
export function extractDomain(stored: string): string {
  try {
    const target = new URL(stored).searchParams.get('url')
    if (target) return new URL(target).hostname
  } catch {}
  return stored
}
