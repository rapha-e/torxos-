#!/usr/bin/env bash
# ==============================================================================
# TorxOS — Script de Atualização Total & Configuração Asaas para VPS
# Uso:
#   ./scripts/update-vps.sh [ASAAS_API_KEY] [ASAAS_WEBHOOK_TOKEN]
# Ou simplesmente:
#   ./scripts/update-vps.sh
# ==============================================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}     🚀 TorxOS — Atualização Geral & Ativação de Produção Asaas   ${NC}"
echo -e "${BLUE}=================================================================${NC}"

# 1. Diretório base
PROJECT_DIR="/opt/torxos"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
fi

echo -e "\n${BLUE}📥 1. Puxando as atualizações mais recentes do repositório...${NC}"
git pull origin main

# 2. Configuração do arquivo .env.production
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        ENV_FILE=".env"
    else
        echo -e "${RED}❌ Arquivo de ambiente não encontrado!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Utilizando arquivo:${NC} $ENV_FILE"

# 3. Injetar ou atualizar credenciais do Asaas com segurança
update_env_var() {
    local key="$1"
    local val="$2"
    if [ -n "$val" ]; then
        if grep -q "^${key}=" "$ENV_FILE"; then
            sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
        else
            echo "${key}=${val}" >> "$ENV_FILE"
        fi
    fi
}

echo -e "\n${BLUE}🔑 2. Verificando configuração do Asaas no ambiente...${NC}"
update_env_var "ASAAS_API_URL" "https://api.asaas.com/v3"

GIVEN_KEY="$1"
GIVEN_TOKEN="$2"

if [ -n "$GIVEN_KEY" ]; then
    update_env_var "ASAAS_API_KEY" "$GIVEN_KEY"
    echo -e "${GREEN}✅ Chave Asaas atualizada no $ENV_FILE!${NC}"
fi

if [ -n "$GIVEN_TOKEN" ]; then
    update_env_var "ASAAS_WEBHOOK_TOKEN" "$GIVEN_TOKEN"
    echo -e "${GREEN}✅ Webhook Token atualizado no $ENV_FILE!${NC}"
fi

# 4. Rebuild e reinicialização dos contêineres API e WEB
echo -e "\n${BLUE}📦 3. Compilando e reiniciando a API e o Frontend Web...${NC}"
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --build evorix_api evorix_web

echo -e "\n${BLUE}⏳ 4. Aguardando inicialização dos serviços (10 segundos)...${NC}"
sleep 10

# 5. Validação de Saúde dos Contêineres
echo -e "\n${BLUE}🔍 5. Verificando status dos contêineres Docker...${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "\n${GREEN}=================================================================${NC}"
echo -e "${GREEN}  🎉 TorxOS atualizado com sucesso!${NC}"
echo -e "${GREEN}  - Painel: https://torxos.tech${NC}"
echo -e "${GREEN}  - Super Admin: https://torxos.tech/super-admin${NC}"
echo -e "${GREEN}  - Webhook Asaas: https://torxos.tech/api/v1/asaas/webhook${NC}"
echo -e "${GREEN}=================================================================${NC}"
