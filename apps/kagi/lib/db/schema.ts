import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const keyTypeEnum = pgEnum('key_type', [
  'simple',
  'group',
  'ssh',
  'json'
])

export const environmentEnum = pgEnum('environment', [
  'production',
  'staging',
  'development',
  'local'
])

export const envFileTypeEnum = pgEnum('env_file_type', [
  'env',
  'env.local',
  'env.production',
  'env.development'
])

// ─── better-auth Tables ───────────────────────────────────────────────────────
// These are managed by better-auth; defined here so drizzle-kit can migrate them.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
})

// ─── Key Categories (First Level) ────────────────────────────────────────────

export const keyCategories = pgTable('key_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  // Either a URL to an external logo image or null
  iconUrl: text('icon_url'),
  // Simple Icons slug, e.g. "openai", "amazonaws", "github"
  iconSlug: varchar('icon_slug', { length: 50 }),
  // Hex color for the category badge, e.g. "#22c55e"
  color: varchar('color', { length: 7 }),
  keyType: keyTypeEnum('key_type').notNull(),
  // For 'simple' type: the env var name, e.g. "OPENAI_API_KEY"
  envVarName: varchar('env_var_name', { length: 255 }),
  // For 'group' type: ordered list of field names
  fieldDefinitions: jsonb('field_definitions').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// ─── Key Entries (Second Level) ───────────────────────────────────────────────

export const keyEntries = pgTable('key_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => keyCategories.id, { onDelete: 'cascade' }),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  description: text('description'),
  environment: environmentEnum('environment').default('production').notNull(),
  // AES-256-GCM encrypted value, format: "iv:authTag:ciphertext" (all base64)
  // - simple  → encrypted plain string
  // - group   → encrypted JSON object { [field]: value }
  // - ssh/json → encrypted file content
  encryptedValue: text('encrypted_value').notNull(),
  // Original filename for SSH key or JSON credential files
  fileName: varchar('file_name', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at')
})

// ─── 2FA Recovery Tokens ──────────────────────────────────────────────────────

export const twoFactorTokens = pgTable('two_factor_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  service: varchar('service', { length: 255 }).notNull(),
  label: varchar('label', { length: 255 }),
  // AES-256-GCM encrypted JSON array of recovery token strings
  encryptedTokens: text('encrypted_tokens').notNull(),
  totalCount: integer('total_count').default(0).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// ─── Access Keys (Programmatic API Auth) ─────────────────────────────────────

export const accessKeys = pgTable(
  'access_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    // SHA-256 hex of the full "kagi_<token>" string — never stored plaintext
    keyHash: text('key_hash').notNull(),
    // First 8 chars of the random portion for user-facing identification, e.g. "kagi_ab12cd34"
    keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
    // Granted permission scopes, e.g. ['entries:read', 'entries:reveal']
    scopes: text('scopes').array().notNull(),
    lastUsedAt: timestamp('last_used_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('access_keys_key_hash_idx').on(table.keyHash),
    index('access_keys_user_id_idx').on(table.userId)
  ]
)

// ─── Env Manager ─────────────────────────────────────────────────────────────

export const envProjects = pgTable(
  'env_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (t) => [index('env_projects_user_id_idx').on(t.userId)]
)

export const envFiles = pgTable(
  'env_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => envProjects.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fileType: envFileTypeEnum('file_type').notNull(),
    encryptedContent: text('encrypted_content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (t) => [
    uniqueIndex('env_files_project_type_idx').on(t.projectId, t.fileType),
    index('env_files_user_id_idx').on(t.userId)
  ]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  keyCategories: many(keyCategories),
  twoFactorTokens: many(twoFactorTokens),
  accessKeys: many(accessKeys),
  envProjects: many(envProjects)
}))

export const accessKeysRelations = relations(accessKeys, ({ one }) => ({
  user: one(user, {
    fields: [accessKeys.userId],
    references: [user.id]
  })
}))

export const keyCategoriesRelations = relations(
  keyCategories,
  ({ one, many }) => ({
    user: one(user, {
      fields: [keyCategories.userId],
      references: [user.id]
    }),
    entries: many(keyEntries)
  })
)

export const keyEntriesRelations = relations(keyEntries, ({ one }) => ({
  category: one(keyCategories, {
    fields: [keyEntries.categoryId],
    references: [keyCategories.id]
  })
}))

export const twoFactorTokensRelations = relations(
  twoFactorTokens,
  ({ one }) => ({
    user: one(user, {
      fields: [twoFactorTokens.userId],
      references: [user.id]
    })
  })
)

export const envProjectsRelations = relations(envProjects, ({ one, many }) => ({
  user: one(user, {
    fields: [envProjects.userId],
    references: [user.id]
  }),
  files: many(envFiles)
}))

export const envFilesRelations = relations(envFiles, ({ one }) => ({
  project: one(envProjects, {
    fields: [envFiles.projectId],
    references: [envProjects.id]
  }),
  user: one(user, {
    fields: [envFiles.userId],
    references: [user.id]
  })
}))
