FROM node:22-alpine AS base

# ── Stage 1: Prune the monorepo to just the kagi app ─────────────────────────
FROM base AS pruner
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune kagi --docker

# ── Stage 2: Install dependencies + build ─────────────────────────────────────
FROM base AS builder
RUN corepack enable
WORKDIR /app

# Install with package.json-only tree first so this layer is cached
# on source-only changes (when lockfile/package.json are unchanged).
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Overlay the full pruned source tree and build.
COPY --from=pruner /app/out/full/ .

# NEXT_PUBLIC_APP_URL is baked into the client bundle at build time.
# Pass it via --build-arg in CI/CD or docker build commands.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm --filter kagi build

# ── Stage 3: Minimal production runtime ───────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js standalone output: self-contained server.js + trimmed node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/.next/standalone ./

# Static assets are NOT included in the standalone dir — copy them separately.
COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/.next/static ./apps/kagi/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/kagi/public        ./apps/kagi/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# server.js path mirrors the monorepo workspace structure inside the
# standalone output directory (apps/kagi relative to the repo root).
CMD ["node", "apps/kagi/server.js"]
