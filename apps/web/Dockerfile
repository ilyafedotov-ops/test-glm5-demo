# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY .eslintrc.cjs ./
COPY apps/web/package.json ./apps/web/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY packages/logging/package.json ./packages/logging/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/logging ./packages/logging
COPY packages/contracts ./packages/contracts
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web
COPY tsconfig.json ./
COPY tsconfig.build.json ./

# Build shared packages
RUN pnpm --filter @nexusops/logging build
RUN pnpm --filter @nexusops/contracts build
RUN pnpm --filter @nexusops/ui build

# Build web app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nexusops/web build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the entire standalone output which includes all necessary files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
RUN mkdir -p ./apps/web/public && chown -R nextjs:nodejs ./apps/web/public

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
