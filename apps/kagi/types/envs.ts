export type EnvFileType = 'env' | 'env.local' | 'env.production' | 'env.development'

export const ENV_FILE_TYPES: EnvFileType[] = [
  'env',
  'env.local',
  'env.production',
  'env.development'
]

export interface EnvProject {
  id: string
  userId: string
  name: string
  description: string | null
  fileCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateEnvProjectInput {
  name: string
  description?: string
}

export type UpdateEnvProjectInput = Partial<CreateEnvProjectInput>

export interface EnvFile {
  id: string
  projectId: string
  userId: string
  fileType: EnvFileType
  createdAt: string
  updatedAt: string
  // encryptedContent is never sent — only via /reveal
}

export interface EnvProjectWithFiles extends EnvProject {
  files: EnvFile[]
}

export interface RevealedEnvFile {
  id: string
  projectId: string
  fileType: EnvFileType
  content: string
}

export interface CreateEnvFileInput {
  fileType: EnvFileType
  content: string // plaintext .env content, encrypted server-side
}
