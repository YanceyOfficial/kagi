import type {
  ApiSuccess,
  CreateTwoFactorTokenInput,
  RevealedTwoFactorTokens,
  TwoFactorToken
} from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to reveal tokens')
      }
      const json: ApiSuccess<RevealedTwoFactorTokens> = await res.json()
      return json.data
    },
    onError: (err: Error) => toast.error(err.message)
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create 2FA token set')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['2fa'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('2FA recovery tokens saved')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useDeleteTwoFactor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/2fa/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to delete')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['2fa'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('2FA token set deleted')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}
