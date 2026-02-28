import type { ApiSuccess, KeyCategory } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

async function fetchCategories(search?: string): Promise<KeyCategory[]> {
  const url = new URL('/api/categories', window.location.origin)
  if (search) url.searchParams.set('search', search)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch categories')
  const json: ApiSuccess<KeyCategory[]> = await res.json()
  return json.data
}

export function useCategories(search?: string) {
  return useQuery({
    queryKey: ['categories', search],
    queryFn: () => fetchCategories(search)
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<KeyCategory>) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create category')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Category created')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<KeyCategory> & { id: string }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update category')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to delete category')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Category deleted')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}
