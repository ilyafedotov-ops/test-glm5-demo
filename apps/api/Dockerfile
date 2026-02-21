# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl-dev

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/logging/package.json ./packages/logging/

# Install dependencies (including native modules like bcrypt)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/logging ./packages/logging
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
COPY tsconfig.json ./
COPY tsconfig.build.json ./

# Build logging package first
RUN pnpm --filter @nexusops/logging build

# Build contracts
RUN pnpm --filter @nexusops/contracts build

# Generate Prisma client
RUN pnpm --filter @nexusops/api db:generate

# Build API
RUN pnpm --filter @nexusops/api build

# Production stage
FROM node:20-alpine AS runner

# Install runtime dependencies + build tools for native modules
RUN apk add --no-cache openssl dumb-init python3 make g++ openssl-dev

WORKDIR /app

# Copy the entire monorepo structure
COPY --from=builder /app ./

# Rebuild bcrypt natively using npm directly
RUN cd /app/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && npm run install

# Cleanup build dependencies to reduce image size (optional)
RUN apk del python3 make g++ openssl-dev

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/apps/api

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
