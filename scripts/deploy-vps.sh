#!/usr/bin/env bash
# ==============================================================================
# TorxOS / Evorix — Script de Deploy Automatizado para Servidor VPS (Linux/Ubuntu)
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}     🚀 TorxOS / Evorix — Inicialização de Deploy VPS Produção    ${NC}"
echo -e "${BLUE}=================================================================${NC}"

# 1. Verificar Docker e Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️ Docker não encontrado. Instalando Docker Engine oficial...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm -f get-docker.sh
    echo -e "${GREEN}✅ Docker instalado com sucesso.${NC}"
fi

# 2. Verificar arquivo de ambiente de produção
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        echo -e "${YELLOW}⚠️ .env.production não encontrado. Utilizando .env existente...${NC}"
        ENV_FILE=".env"
    else
        echo -e "${RED}❌ Arquivo .env.production não encontrado!${NC}"
        echo -e "${YELLOW}Crie o arquivo a partir do template:${NC}"
        echo -e "cp .env.production.example .env.production && nano .env.production"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Utilizando arquivo de configuração:${NC} $ENV_FILE"

# 3. Detectar arquivo de Compose de Produção
COMPOSE_FILE="docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${YELLOW}⚠️ docker-compose.prod.yml não encontrado. Usando docker-compose.yml padrão...${NC}"
    COMPOSE_FILE="docker-compose.yml"
fi

echo -e "${GREEN}✅ Utilizando Compose:${NC} $COMPOSE_FILE"

# 4. Baixar imagens pré-compiladas do GHCR (Zero compilação na VPS)
echo -e "\n${BLUE}⬇️ Baixando imagens atualizadas do GitHub Container Registry (GHCR)...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull || {
    echo -e "${YELLOW}⚠️ Aviso: Falha ao puxar do GHCR ou usando build local. Continuando...${NC}"
}

# 5. Subir contêineres em segundo plano e compilar imagens locais
echo -e "\n${BLUE}📦 Inicializando contêineres em produção...${NC}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --remove-orphans

# 6. Aguardar inicialização do PostgreSQL e API
echo -e "\n${BLUE}⏳ Aguardando serviços ficarem operacionais...${NC}"
sleep 8

# 7. Executar migrações do PostgreSQL no contêiner da API
echo -e "\n${BLUE}🗄️ Executando migrações do PostgreSQL (Prisma)...${NC}"
docker compose -f "$COMPOSE_FILE" exec -T evorix_api npx prisma migrate deploy --schema=./prisma/schema.postgresql.prisma || {
    echo -e "${YELLOW}⚠️ Sincronizando schema via db push...${NC}"
    docker compose -f "$COMPOSE_FILE" exec -T evorix_api npx prisma db push --schema=./prisma/schema.postgresql.prisma --accept-data-loss
}

# 8. Status dos contêineres
echo -e "\n${GREEN}=================================================================${NC}"
echo -e "${GREEN}      🎉 Deploy concluído com sucesso no servidor VPS!          ${NC}"
echo -e "${GREEN}=================================================================${NC}"
docker compose -f "$COMPOSE_FILE" ps

echo -e "\n${BLUE}📡 Endereços de Acesso:${NC}"
echo -e " • Plataforma Web:     ${GREEN}http://IP_DA_SUA_VPS (Porta 80 / 443)${NC}"
echo -e " • API RESTful:        ${GREEN}http://IP_DA_SUA_VPS/api/v1${NC}"
echo -e " • Swagger Docs:       ${GREEN}http://IP_DA_SUA_VPS/api/docs${NC}"
echo -e "\n${YELLOW}💡 Para ver logs em tempo real:${NC} docker compose -f $COMPOSE_FILE logs -f"
