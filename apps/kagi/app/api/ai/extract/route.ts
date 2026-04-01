import { apiError, requireSession, withAuth } from '@/lib/api-helpers'
import { db } from '@/lib/db'
import { keyCategories, keyEntries } from '@/lib/db/schema'
import { decrypt, decryptJson } from '@/lib/encryption'
import { ErrorCode } from '@/lib/error-codes'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

type SecretFormat = 'hex' | 'base64' | 'base64url' | 'alphanumeric'

const ALPHANUM_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateSecret(bytes: number, format: SecretFormat): string {
  const buf = randomBytes(bytes)
  switch (format) {
    case 'hex':
      return buf.toString('hex')
    case 'base64':
      return buf.toString('base64')
    case 'base64url':
      return buf.toString('base64url')
    case 'alphanumeric': {
      const result: string[] = []
      for (const byte of buf) {
        if (byte < 248)
          result.push(ALPHANUM_CHARS[byte % ALPHANUM_CHARS.length])
        if (result.length === bytes) break
      }
      while (result.length < bytes) {
        const b = randomBytes(1)[0]
        if (b < 248) result.push(ALPHANUM_CHARS[b % ALPHANUM_CHARS.length])
      }
      return result.join('')
    }
  }
}

const requestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  currentProjectName: z.string().optional()
})

// The AI returns selected key references + secrets to generate (no actual values)
const aiResponseSchema = z.object({
  selectedKeys: z.array(
    z.object({
      entryId: z.string().uuid(),
      envVarName: z.string().min(1),
      reason: z.string()
    })
  ),
  secretsToGenerate: z.array(
    z.object({
      envVarName: z.string().min(1),
      format: z.enum(['hex', 'base64', 'base64url', 'alphanumeric']),
      bytes: z.number().int().min(16).max(64),
      reason: z.string()
    })
  )
})

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const session = await requireSession('ai:extract')
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success)
      return apiError(parsed.error.message, 400, ErrorCode.VALIDATION_ERROR)

    const { prompt, currentProjectName } = parsed.data

    // Fetch all categories + entries for this user (names only — no values)
    const allCategories = await db
      .select()
      .from(keyCategories)
      .where(eq(keyCategories.userId, session.user.id))

    const allEntries = await db
      .select({
        id: keyEntries.id,
        categoryId: keyEntries.categoryId,
        projectName: keyEntries.projectName,
        environment: keyEntries.environment,
        description: keyEntries.description,
        notes: keyEntries.notes
      })
      .from(keyEntries)
      .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
      .where(eq(keyCategories.userId, session.user.id))

    // Build a structured context for the AI (key names only, never values)
    const keyContext = allCategories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      ...(cat.description && { categoryDescription: cat.description }),
      keyType: cat.keyType,
      envVarName: cat.envVarName,
      fieldDefinitions: cat.fieldDefinitions,
      entries: allEntries
        .filter((e) => e.categoryId === cat.id)
        .map((e) => ({
          entryId: e.id,
          projectName: e.projectName,
          environment: e.environment,
          ...(e.description && { description: e.description }),
          ...(e.notes && { notes: e.notes })
        }))
    }))

    const currentProjectHint = currentProjectName
      ? `The user is currently working in the "${currentProjectName}" project. When the user says "this project", "本项目", "current project", or similar, they mean "${currentProjectName}". Strongly prefer entries with projectName="${currentProjectName}" unless the user explicitly asks for a different project.`
      : ''

    const systemPrompt = `You are a key management assistant for the Kagi application.
Your job is to analyze a user's request and select the appropriate private keys from their key vault, and optionally generate random secrets.

IMPORTANT RULES:
- You will ONLY see key names and project names — never actual secret values
- Select only the keys that match the user's request
- ${currentProjectHint}
- Do NOT add NEXT_PUBLIC_ prefix unless the user explicitly mentions Next.js. For Electron, React Native, plain Node.js, or other non-Next.js targets, use the env var name exactly as defined.
- If the user specifies a project name, prefer entries with that projectName
- If no project is specified, select entries that seem most relevant
- Return the entryId from the provided key context
- Provide a brief reason for each selection

SECRET GENERATION:
- If the user asks for random secrets, session secrets, JWT secrets, passwords, encryption keys, or similar generated values that are NOT in the vault, add them to secretsToGenerate.
- Use format "hex" (default, like openssl rand -hex 32) for most secrets.
- Use format "base64url" for JWT secrets. Use "alphanumeric" for human-readable passwords.
- Default bytes: 32 (256-bit). Use 64 bytes for extra-strong keys.
- Common patterns to recognize: "session secret", "登录密码", "JWT_SECRET", "APP_SECRET", "ENCRYPTION_KEY", "AUTH_SECRET", "随机密钥", "random key/secret/password"
- ALL env var names MUST be SCREAMING_SNAKE_CASE (uppercase letters and underscores only, e.g. BETTER_AUTH_SECRET, not better-auth-random-key)
- Do NOT generate secrets for things already in the vault — look them up instead.

Available keys in the vault:
${JSON.stringify(keyContext, null, 2)}`

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: aiResponseSchema,
      system: systemPrompt,
      prompt
    })

    // Build valid entry ID set to prevent injection attacks
    const validEntryIds = new Set(allEntries.map((e) => e.id))

    const selected = object.selectedKeys
      .filter((k) => validEntryIds.has(k.entryId))
      .map((k) => ({
        ...k,
        envVarName: k.envVarName.toUpperCase().replace(/-/g, '_')
      }))

    const secretsToGenerate = object.secretsToGenerate ?? []

    if (selected.length === 0 && secretsToGenerate.length === 0) {
      return NextResponse.json({
        data: {
          selectedKeys: [],
          generatedSecrets: [],
          envContent: '# No matching keys found'
        }
      })
    }

    // Fetch and decrypt the selected entries to build the .env file
    const entryRows = await db
      .select({ entry: keyEntries, category: keyCategories })
      .from(keyEntries)
      .innerJoin(keyCategories, eq(keyEntries.categoryId, keyCategories.id))
      .where(eq(keyCategories.userId, session.user.id))

    const envLines: string[] = [
      '# Generated by Kagi AI Key Extractor',
      `# Prompt: ${prompt}`,
      ''
    ]

    for (const selectedKey of selected) {
      const row = entryRows.find((r) => r.entry.id === selectedKey.entryId)
      if (!row) continue

      const { entry, category } = row

      if (category.keyType === 'group') {
        const values = decryptJson<Record<string, string>>(entry.encryptedValue)
        const fields = category.fieldDefinitions ?? Object.keys(values)

        envLines.push(`# ${category.name} — ${entry.projectName}`)
        for (const field of fields) {
          if (values[field] !== undefined) {
            envLines.push(`${field}=${values[field]}`)
          }
        }
        envLines.push('')
      } else {
        const value = decrypt(entry.encryptedValue)
        const comment = `# ${category.name} — ${entry.projectName}${selectedKey.reason ? ` (${selectedKey.reason})` : ''}`
        envLines.push(comment)
        envLines.push(`${selectedKey.envVarName}=${value}`)
        envLines.push('')
      }
    }

    // Append generated secrets
    const generatedSecretsMeta = secretsToGenerate.map((s) => ({
      envVarName: s.envVarName.toUpperCase().replace(/-/g, '_'),
      format: s.format as 'hex' | 'base64' | 'base64url' | 'alphanumeric',
      bytes: s.bytes,
      reason: s.reason
    }))

    if (generatedSecretsMeta.length > 0) {
      envLines.push('# Generated secrets')
      for (const s of generatedSecretsMeta) {
        envLines.push(`# ${s.envVarName} — ${s.reason}`)
        envLines.push(`${s.envVarName}=${generateSecret(s.bytes, s.format)}`)
        envLines.push('')
      }
    }

    return NextResponse.json({
      data: {
        selectedKeys: selected,
        generatedSecrets: generatedSecretsMeta,
        envContent: envLines.join('\n')
      }
    })
  })
}
