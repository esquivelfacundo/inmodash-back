# Multi-stage build for Node.js API
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Change ownership
RUN chown -R apiuser:nodejs /app

USER apiuser

EXPOSE 3001

ENV PORT=3001

# Run migration script (don't fail if it errors) and start server
CMD ["sh", "-c", "node scripts/apply-whatsapp-migration.js || true && node dist/server.js"]
