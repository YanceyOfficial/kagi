import { ApiError, throwIfError } from '@/lib/api-client'
import type {
  ApiSuccess,
  CreateEnvFileInput,
  CreateEnvProjectInput,
  EnvFile,
  EnvProject,
  EnvProjectWithFiles,
  RevealedEnvFile,
  UpdateEnvProjectInput
} from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sileo } from 'sileo'

// ─── Projects ─────────────────────────────────────────────────────────────────

async function fetchEnvProjects(search?: string): Promise<EnvProject[]> {
  const url = new URL('/api/envs', window.location.origin)
  if (search) url.searchParams.set('search', search)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch env projects')
  const json: ApiSuccess<EnvProject[]> = await res.json()
  return json.data
}

export function useEnvProjects(search?: string) {
  return useQuery({
    queryKey: ['envs', search],
    queryFn: () => fetchEnvProjects(search)
  })
}

export function useEnvProject(id: string) {
  return useQuery({
    queryKey: ['envs', id],
    queryFn: async () => {
      const res = await fetch(`/api/envs/${id}`)
      if (!res.ok) throw new Error('Failed to fetch env project')
      const json: ApiSuccess<EnvProjectWithFiles> = await res.json()
      return json.data
    },
    enabled: !!id
  })
}

export function useCreateEnvProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateEnvProjectInput) => {
      const res = await fetch('/api/envs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) await throwIfError(res, 'Failed to create project')
      const json: ApiSuccess<EnvProject> = await res.json()
      return json.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['envs'] })
      sileo.success({ title: 'Project created' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useUpdateEnvProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: UpdateEnvProjectInput & { id: string }) => {
      const res = await fetch(`/api/envs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) await throwIfError(res, 'Failed to update project')
      const json: ApiSuccess<EnvProject> = await res.json()
      return json.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['envs', variables.id] })
      qc.invalidateQueries({ queryKey: ['envs'] })
      sileo.success({ title: 'Project updated' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useDeleteEnvProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/envs/${id}`, { method: 'DELETE' })
      if (!res.ok) await throwIfError(res, 'Failed to delete project')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['envs'] })
      sileo.success({ title: 'Project deleted' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

// ─── Files ────────────────────────────────────────────────────────────────────

export function useSaveEnvFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      ...data
    }: CreateEnvFileInput & { projectId: string }) => {
      const res = await fetch(`/api/envs/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) await throwIfError(res, 'Failed to save env file')
      const json: ApiSuccess<EnvFile> = await res.json()
      return json.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['envs', variables.projectId] })
      qc.invalidateQueries({ queryKey: ['envs'] })
      sileo.success({ title: 'File saved' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useRevealEnvFile() {
  return useMutation({
    mutationFn: async ({
      projectId,
      fileId
    }: {
      projectId: string
      fileId: string
    }) => {
      const res = await fetch(`/api/envs/${projectId}/files/${fileId}/reveal`, {
        method: 'POST'
      })
      if (!res.ok) await throwIfError(res, 'Failed to reveal env file')
      const json: ApiSuccess<RevealedEnvFile> = await res.json()
      return json.data
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}

export function useDeleteEnvFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      fileId
    }: {
      projectId: string
      fileId: string
    }) => {
      const res = await fetch(`/api/envs/${projectId}/files/${fileId}`, {
        method: 'DELETE'
      })
      if (!res.ok) await throwIfError(res, 'Failed to delete env file')
      return res.json()
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['envs', variables.projectId] })
      qc.invalidateQueries({ queryKey: ['envs'] })
      sileo.success({ title: 'File deleted' })
    },
    onError: (err: ApiError) =>
      sileo.error({ title: err.message, description: `Code: ${err.code}` })
  })
}
