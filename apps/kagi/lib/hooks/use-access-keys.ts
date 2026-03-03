import { ApiError, throwIfError } from '@/lib/api-client'
import type {
  AccessKey,
  ApiSuccess,
  CreateAccessKeyInput,
  CreateAccessKeyResponse
} from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sileo } from 'sileo'

export function useAccessKeys() {
  return useQuery({
    queryKey: ['access-keys'],
    queryFn: async () => {
      const res = await fetch('/api/access-keys')
      if (!res.ok) throw new Error('Failed to fetch access keys')
      const json: ApiSuccess<AccessKey[]> = await res.json()
      return json.data
    }
  })
}

export function useCreateAccessKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateAccessKeyInput) => {
      const res = await fetch('/api/access-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      if (!res.ok) await throwIfError(res, 'Failed to create access key')
      const json: ApiSuccess<CreateAccessKeyResponse> = await res.json()
      return json.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-keys'] })
      sileo.warning({
        title: 'Access key created — save it now',
        description:
          'The plaintext key is shown only once and cannot be retrieved later.'
      })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useRevokeAccessKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/access-keys/${id}`, { method: 'DELETE' })
      if (!res.ok) await throwIfError(res, 'Failed to revoke access key')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-keys'] })
      sileo.success({ title: 'Access key revoked' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}
