# Build from repo root:
#   docker build -f apps/kagi/Dockerfile -t kagi .

# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/kagi/package.json ./apps/kagi/
COPY packages/tsconfig/package.json ./packages/tsconfig/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/kagi/node_modules ./apps/kagi/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/kagi && pnpm build

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# In a monorepo standalone build the output mirrors the full path tree:
#   .next/standalone/apps/kagi/server.js
COPY --from=builder /app/apps/kagi/public ./apps/kagi/public

COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/.next/static ./apps/kagi/.next/static

# Self-contained migrate directory with deps + SQL files
# Layout: /app/migrate/scripts/migrate.mjs + /app/migrate/drizzle/migrations/
# This preserves the ../drizzle/migrations relative path from the script
RUN mkdir -p /app/migrate/scripts && cd /app/migrate \
    && echo '{"private":true,"type":"module"}' > package.json \
    && npm install drizzle-orm pg \
    && rm package.json package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/drizzle /app/migrate/drizzle
COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/scripts/migrate.mjs /app/migrate/scripts/migrate.mjs

# Entrypoint: migrate then start
COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/scripts/entrypoint.sh /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/entrypoint.sh"]
