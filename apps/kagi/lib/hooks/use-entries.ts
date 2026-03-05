import { ApiError, throwIfError } from '@/lib/api-client'
import type {
  ApiSuccess,
  CreateKeyEntryInput,
  KeyEntryWithCategory,
  RevealedKeyValue
} from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sileo } from 'sileo'

async function fetchEntries(
  categoryId?: string,
  search?: string
): Promise<KeyEntryWithCategory[]> {
  const url = new URL('/api/entries', window.location.origin)
  if (categoryId) url.searchParams.set('categoryId', categoryId)
  if (search) url.searchParams.set('search', search)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch entries')
  const json: ApiSuccess<KeyEntryWithCategory[]> = await res.json()
  return json.data
}

export function useEntries(categoryId?: string, search?: string) {
  return useQuery({
    queryKey: ['entries', categoryId, search],
    queryFn: () => fetchEntries(categoryId, search)
  })
}

export function useProjectNames() {
  return useQuery({
    queryKey: ['entries', 'project-names'],
    queryFn: async () => {
      const res = await fetch('/api/entries/project-names')
      if (!res.ok) throw new Error('Failed to fetch project names')
      const json: ApiSuccess<string[]> = await res.json()
      return json.data
    }
  })
}

export function useRevealEntry() {
  return useMutation({
    mutationFn: async (id: string): Promise<RevealedKeyValue> => {
      const res = await fetch(`/api/entries/${id}/reveal`, { method: 'POST' })
      if (!res.ok) await throwIfError(res, 'Failed to reveal key')
      const json: ApiSuccess<RevealedKeyValue> = await res.json()
      return json.data
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateKeyEntryInput) => {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) await throwIfError(res, 'Failed to create entry')
      return res.json()
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['entries', variables.categoryId] })
      qc.invalidateQueries({ queryKey: ['entries'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      sileo.success({ title: 'Key entry created' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useUpdateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<CreateKeyEntryInput> & { id: string }) => {
      const res = await fetch(`/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) await throwIfError(res, 'Failed to update entry')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      sileo.success({ title: 'Key entry updated' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (!res.ok) await throwIfError(res, 'Failed to delete entry')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      sileo.success({ title: 'Key entry deleted' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

