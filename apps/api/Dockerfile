# ============================================================================
# EVORIX API — Dockerfile Multi-Stage de Produção (NestJS 10 + Fastify)
# ============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Instala OpenSSL e bibliotecas de compatibilidade para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copia arquivos de dependência do monorepo
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Instala todas as dependências (incluindo devDependencies)
RUN npm ci

# Copia código-fonte da API
COPY apps/api ./apps/api

# Gera Prisma Client oficial para PostgreSQL
WORKDIR /app/apps/api
RUN npx prisma generate --schema=./prisma/schema.postgresql.prisma

# Compila código TypeScript para produção
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

# Instala OpenSSL no runtime do Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copia dependências compiladas e Prisma Client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package*.json ./apps/api/

USER nestjs

EXPOSE 3001

WORKDIR /app/apps/api
CMD ["npm", "run", "start:prod"]
