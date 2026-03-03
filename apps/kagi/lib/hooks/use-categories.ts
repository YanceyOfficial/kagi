import { ApiError, throwIfError } from '@/lib/api-client'
import type { ApiSuccess, KeyCategory } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sileo } from 'sileo'

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
      if (!res.ok) await throwIfError(res, 'Failed to create category')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      sileo.success({ title: 'Category created' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
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
      if (!res.ok) await throwIfError(res, 'Failed to update category')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      sileo.success({ title: 'Category updated' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) await throwIfError(res, 'Failed to delete category')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      sileo.success({ title: 'Category deleted' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}
