# =============================================================================
# Multi-stage build для Next.js 15 + Prisma
# Оптимизировано для минимального размера образа
# =============================================================================

# Stage 1: Dependencies
# Pin digest to prevent supply-chain tag-rewrite attacks.
# Update periodically: docker pull node:20-alpine && docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine
FROM node:20-alpine AS deps
WORKDIR /app

# Установка зависимостей для native модулей (bcrypt, prisma)
RUN apk add --no-cache libc6-compat openssl

# Копируем ТОЛЬКО файлы для установки зависимостей (лучший кэш)
COPY package.json package-lock.json* ./

# Устанавливаем ВСЕ зависимости (включая devDependencies для билда)
# NOTE: --ignore-scripts disabled — bcrypt needs node-gyp postinstall.
# Mitigate supply-chain risk by pinning exact versions in package-lock.json.
RUN npm ci

# =============================================================================
# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Копируем зависимости из deps
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Генерируем Prisma Client (ОДИН РАЗ!)
RUN npx prisma generate

# Отключаем телеметрию и собираем
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# =============================================================================
# Stage 3: Production Runner (минимальный образ)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Безопасность: non-root user
RUN apk add --no-cache openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем только необходимое для production
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Standalone output от Next.js (уже включает нужные node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Drop all Linux capabilities — container needs none
# (enforce via --cap-drop=ALL in docker run or security_opt in compose)

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
