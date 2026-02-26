import type {
  ApiSuccess,
  CreateKeyEntryInput,
  KeyEntryWithCategory,
  RevealedKeyValue
} from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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

export function useRevealEntry() {
  return useMutation({
    mutationFn: async (id: string): Promise<RevealedKeyValue> => {
      const res = await fetch(`/api/entries/${id}/reveal`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to reveal key')
      }
      const json: ApiSuccess<RevealedKeyValue> = await res.json()
      return json.data
    },
    onError: (err: Error) => toast.error(err.message)
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create entry')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['entries', variables.categoryId] })
      qc.invalidateQueries({ queryKey: ['entries'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Key entry created')
    },
    onError: (err: Error) => toast.error(err.message)
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update entry')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      toast.success('Key entry updated')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to delete entry')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Key entry deleted')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload failed')
      }
      const json: ApiSuccess<{
        fileName: string
        contentType: string
        content: string
      }> = await res.json()
      return json.data
    },
    onError: (err: Error) => toast.error(err.message)
  })
}
