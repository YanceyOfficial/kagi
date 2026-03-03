import { ApiError, throwIfError } from '@/lib/api-client'
import type {
  ApiSuccess,
  CreateTwoFactorTokenInput,
  RevealedTwoFactorTokens,
  TwoFactorToken
} from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sileo } from 'sileo'

async function fetchTwoFactorTokens(
  search?: string
): Promise<TwoFactorToken[]> {
  const url = new URL('/api/2fa', window.location.origin)
  if (search) url.searchParams.set('search', search)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch 2FA tokens')
  const json: ApiSuccess<TwoFactorToken[]> = await res.json()
  return json.data
}

export function useTwoFactorTokens(search?: string) {
  return useQuery({
    queryKey: ['2fa', search],
    queryFn: () => fetchTwoFactorTokens(search)
  })
}

export function useRevealTwoFactor() {
  return useMutation({
    mutationFn: async (id: string): Promise<RevealedTwoFactorTokens> => {
      const res = await fetch(`/api/2fa/${id}/reveal`, { method: 'POST' })
      if (!res.ok) await throwIfError(res, 'Failed to reveal tokens')
      const json: ApiSuccess<RevealedTwoFactorTokens> = await res.json()
      return json.data
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useCreateTwoFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateTwoFactorTokenInput) => {
      const res = await fetch('/api/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) await throwIfError(res, 'Failed to create 2FA token set')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['2fa'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      sileo.success({ title: '2FA recovery tokens saved' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useDeleteTwoFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/2fa/${id}`, { method: 'DELETE' })
      if (!res.ok) await throwIfError(res, 'Failed to delete 2FA token set')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['2fa'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      sileo.success({ title: '2FA token set deleted' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}
