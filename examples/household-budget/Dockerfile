FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY examples/household-budget/package.json ./examples/household-budget/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/react/package.json ./packages/react/
COPY packages/ai-provider/package.json ./packages/ai-provider/

# Create root package.json for workspaces
RUN echo '{"name":"liqueur-build","private":true,"workspaces":["packages/*","examples/*"]}' > /app/package.json

# Install with npm (avoids pnpm ENAMETOOLONG issue)
RUN npm install --legacy-peer-deps

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/examples ./examples

# Copy all source files
COPY packages/protocol ./packages/protocol
COPY packages/react ./packages/react
COPY packages/ai-provider ./packages/ai-provider
COPY examples/household-budget ./examples/household-budget
COPY tsconfig.base.json ./

WORKDIR /app/examples/household-budget

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/examples/household-budget/.next/standalone ./
COPY --from=builder /app/examples/household-budget/.next/static ./examples/household-budget/.next/static
COPY --from=builder /app/examples/household-budget/prisma ./examples/household-budget/prisma

# Create data directory
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/examples/household-budget
CMD ["node", "server.js"]
