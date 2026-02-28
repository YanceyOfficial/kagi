import type {
  AccessKey,
  ApiSuccess,
  CreateAccessKeyInput,
  CreateAccessKeyResponse
} from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create access key')
      }
      const json: ApiSuccess<CreateAccessKeyResponse> = await res.json()
      return json.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-keys'] }),
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useRevokeAccessKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/access-keys/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to revoke access key')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access-keys'] })
      toast.success('Access key revoked')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}
