/**
 * Client-side API error class.
 * Carries the machine-readable `code` from the server alongside the
 * human-readable `message`, so hooks can surface both in toast notifications.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Parse a failed fetch response and throw an ApiError.
 * Call this whenever `res.ok` is false inside a mutation function.
 */
export async function throwIfError(
  res: Response,
  fallback: string
): Promise<never> {
  const data = await res.json().catch(() => ({}))
  throw new ApiError(
    data.error ?? fallback,
    data.code ?? 'UNKNOWN_ERROR',
    res.status
  )
}
