# ============================================================================
# EVORIX WEB — Dockerfile Multi-Stage de Produção (Next.js 14 Standalone)
# ============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência do monorepo
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Instala todas as dependências do monorepo para compilação
RUN npm ci

# Copia código-fonte do frontend
COPY apps/web ./apps/web

# Variável de build para embutir URL da API se fornecida
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api/v1}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Compila o Next.js gerando a versão standalone
WORKDIR /app/apps/web
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia arquivos públicos e os estáticos gerados
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
