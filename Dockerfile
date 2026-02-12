# =============================================================================
# Multi-stage build for Next.js 16 + Prisma
# Secure + small image
# =============================================================================


# ========================
# 1️⃣ Dependencies Stage
# ========================
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./

# install all deps (for build)
RUN npm ci


# ========================
# 2️⃣ Build Stage
# ========================
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ========================
# 3️⃣ Production Runner
# ========================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache openssl \
    && addgroup -S nodejs -g 1001 \
    && adduser -S nextjs -u 1001

# copy public + prisma schema + generated client
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode===200?0:1))"

CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
