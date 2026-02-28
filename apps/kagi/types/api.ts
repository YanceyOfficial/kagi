export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
