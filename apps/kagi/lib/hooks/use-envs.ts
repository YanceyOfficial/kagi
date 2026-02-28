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
import { toast } from 'sonner'

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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create project')
      }
      const json: ApiSuccess<EnvProject> = await res.json()
      return json.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['envs'] })
      toast.success('Project created')
    },
    onError: (err: Error) => toast.error(err.message)
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update project')
      }
      const json: ApiSuccess<EnvProject> = await res.json()
      return json.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['envs', variables.id] })
      qc.invalidateQueries({ queryKey: ['envs'] })
      toast.success('Project updated')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}

export function useDeleteEnvProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/envs/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to delete project')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['envs'] })
      toast.success('Project deleted')
    },
    onError: (err: Error) => toast.error(err.message)
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save env file')
      }
      const json: ApiSuccess<EnvFile> = await res.json()
      return json.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['envs', variables.projectId] })
      qc.invalidateQueries({ queryKey: ['envs'] })
      toast.success('Saved')
    },
    onError: (err: Error) => toast.error(err.message)
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
      const res = await fetch(
        `/api/envs/${projectId}/files/${fileId}/reveal`,
        { method: 'POST' }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to reveal env file')
      }
      const json: ApiSuccess<RevealedEnvFile> = await res.json()
      return json.data
    },
    onError: (err: Error) => toast.error(err.message)
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to delete env file')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['envs', variables.projectId] })
      qc.invalidateQueries({ queryKey: ['envs'] })
      toast.success('File deleted')
    },
    onError: (err: Error) => toast.error(err.message)
  })
}
