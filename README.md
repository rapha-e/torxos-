# 📘 TorxOS — Business Operating Platform

**Versão:** 1.0.0  
**Classificação:** Arquitetura Técnica & Especificação de Engenharia  
**Plataforma:** SaaS B2B Multi-Tenant para Assistências Técnicas de Celulares e Eletrônicos

---

## 🚀 Os 4 Módulos Centrais Integrados

1. **TorxOS OS**: Gestão ágil de Ordens de Serviço, Kanban de bancada, checklists multimídia e aprovação digital remota via link de WhatsApp.
2. **TorxOS Stock**: Controle de peças com **Motor Preditivo de Ruptura**, calculando CMD móvel, estoque de segurança e ponto exato de recompra (ROP).
3. **TorxOS Finance**: Controle financeiro de alta precisão (ERP), DRE em tempo real por regime de competência, fluxo de caixa diário/projetado e múltiplos caixas de balcão.
4. **TorxOS AI Mentor**: Copiloto executivo com **Google Gemini API** conectado aos dados analíticos da loja para orientar o gestor nos **5 Pilares Estratégicos**:
   - 1. Aumentar Faturamento
   - 2. Entender Seu Lucro
   - 3. Organização da Rotina
   - 4. Gestão Financeira
   - 5. Atendimento e Marketing

---

## 🛠️ Stack Tecnológica Oficial

- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Lucide Icons, shadcn/ui design tokens.
- **Backend API**: NestJS (Node.js 20+ LTS, Fastify adapter), Swagger OpenAPI em `/api/docs`.
- **ORM**: Prisma ORM com schema PostgreSQL 16 Multi-Tenant.
- **Banco de Dados**: PostgreSQL 16 com Row-Level Tenancy (`tenant_id`).
- **Cache & Filas**: Redis 7 + BullMQ.
- **Inteligência Artificial**: Google Gemini API (modelo Gemini 1.5 Flash).
- **Mensageria WhatsApp**: Evolution API (Docker).
- **Armazenamento de Mídia**: MinIO (Dev) / Cloudflare R2 ou AWS S3 (Prod).

---

## 📦 Estrutura do Monorepo

```
TorxOS/
├── apps/
│   ├── api/                      # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 10 modelos relacionais PostgreSQL 16
│   │   │   └── seed.ts           # Carga inicial com dados de produção
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/         # JWT Multi-tenant com papéis RBAC
│   │       │   ├── service-orders# TorxOS OS & Portal do Cliente
│   │       │   ├── stock/        # TorxOS Stock & Motor Preditivo
│   │       │   ├── finance/      # TorxOS Finance (Títulos, DRE & Fluxo)
│   │       │   └── ai-mentor/    # TorxOS AI Mentor (5 Pilares & Gemini)
│   │       └── main.ts
│   └── web/                      # Frontend Next.js 14 (App Router)
│       └── src/app/
│           ├── (auth)/login/     # Login executivo
│           ├── (dashboard)/      # Sidebar & Visão 360
│           │   ├── os/           # Lista & Kanban de Bancada
│           │   ├── estoque/      # Catálogo & Semáforo de Ruptura
│           │   ├── financeiro/   # Títulos, DRE & Fluxo de Caixa
│           │   └── mentor/       # Centro dos 5 Pilares & Chat IA
│           └── (public)/status/  # Portal Público para o Cliente
├── docker-compose.yml            # Infraestrutura de desenvolvimento local (com MinIO)
├── docker-compose.prod.yml       # Infraestrutura de produção (Cloudflare R2, GHCR e limites de RAM)
├── package.json                  # Workspaces do monorepo
└── .env                          # Variáveis de ambiente & Chaves de API
```

---

## ⚡ Como Executar Localmente

### 1. Pré-requisitos
- Node.js 20+ LTS instalado
- Docker Desktop (opcional para subir Postgres, Redis e MinIO via `docker compose up -d`)

### 2. Instalação das Dependências
Na raiz do projeto, execute:
```bash
npm.cmd install
```

### 3. Banco de Dados e Migrações (Prisma)
Para gerar o cliente Prisma e rodar as migrações:
```bash
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run prisma:seed
```

### 4. Inicializar em Modo de Desenvolvimento
```bash
# Executar simultaneamente API e Frontend:
npm.cmd run dev

# Ou em terminais separados:
npm.cmd run dev:api   # API: http://localhost:3001/api/v1 (Docs: http://localhost:3001/api/docs)
npm.cmd run dev:web   # Web: http://localhost:3000
```

---

## 🔐 Credenciais de Demonstração

- **Painel de Gestão**: `http://localhost:3000`
  - E-mail: `gestor@torxos.com.br`
  - Senha: `senha123`
- **Portal Público de Aprovação da OS**: `http://localhost:3000/status/demo-token-iphone13`
