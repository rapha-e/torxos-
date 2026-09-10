# EVORIX — Guia Executivo de Implantação e Produção (Deployment Guide)

Este documento contém o passo a passo completo para implantar o **EVORIX Business Operating Platform** em servidores VPS ou Cloud dedicada (DigitalOcean, AWS EC2, Hetzner, Google Cloud, Linode, Oracle Cloud ou servidores locais).

---

## 1. Requisitos Mínimos de Servidor

| Recurso | Mínimo Recomendado | Recomendado para Alta Carga |
| :--- | :--- | :--- |
| **Sistema Operacional** | Ubuntu 22.04 LTS ou 24.04 LTS | Ubuntu 24.04 LTS / Debian 12 |
| **vCPU** | 2 vCPUs | 4 vCPUs |
| **Memória RAM** | 4 GB | 8 GB |
| **Armazenamento** | 40 GB SSD / NVMe | 80+ GB NVMe |
| **Portas Abertas** | 80 (HTTP), 443 (HTTPS), 22 (SSH) | 80, 443, 22 |

---

## 2. Preparação do Servidor (Ubuntu / Debian)

Conecte-se ao seu servidor via SSH e execute os comandos de atualização e instalação do Docker Engine e Docker Compose:

```bash
# 1. Atualizar pacotes do sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências essenciais
sudo apt install -y curl git ufw htop unattended-upgrades

# 3. Configurar Firewall Básico (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Instalar Docker Engine Oficial e Plugin Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Aplica as permissões de grupo
newgrp docker
```

---

## 3. Instalação e Clonagem do EVORIX

```bash
# 1. Clonar o repositório na pasta /opt
cd /opt
sudo git clone https://github.com/seu-usuario/evorix.git evorix
sudo chown -R $USER:$USER /opt/evorix
cd /opt/evorix

# 2. Configurar o arquivo de variáveis de ambiente de produção
cp .env.production.example .env.production
nano .env.production

# 3. Executar deploy automatizado em 1 comando
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

### Configurações Mandatórias no `.env.production`:
Certifique-se de alterar as chaves para segredos fortes e exclusivos em produção:

```env
NODE_ENV=production
PORT=3001
WEB_PORT=3000

# Chave Oficial Google Gemini API (Evorix AI Diagnostic & Mentor)
GEMINI_API_KEY=sua_chave_oficial_gemini_aqui

# Banco de Dados PostgreSQL 16
POSTGRES_USER=evorix_prod_user
POSTGRES_PASSWORD=gere_uma_senha_muito_forte_aqui_64_chars
POSTGRES_DB=evorix_production

# JWT Secrets (Gere com openssl rand -base64 32)
JWT_SECRET=gere_uma_chave_jwt_secreta_com_openssl_rand_hex_32
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=gere_outra_chave_jwt_refresh_com_openssl_rand_hex_32
JWT_REFRESH_EXPIRES_IN=7d

# Imagens Docker pré-compiladas (GitHub Packages / GHCR)
DOCKER_IMAGE_API=ghcr.io/seu-usuario/torxos-api:latest
DOCKER_IMAGE_WEB=ghcr.io/seu-usuario/torxos-web:latest

# Evolution API (WhatsApp Gateway Oficial)
EVOLUTION_API_KEY=gere_um_token_seguro_para_whatsapp

# Armazenamento de Fotos e Laudos (MinIO Local Integrado)
MINIO_ACCESS_KEY=admin_s3_torxos
MINIO_SECRET_KEY=torxos_super_minio_s3_secret_2026
MINIO_BUCKET_NAME=torxos-media
S3_ENDPOINT=http://evorix_minio:9000
S3_REGION=us-east-1
```

---

## 4. Inicialização da Stack com Docker Compose de Produção

Em produção, o `docker-compose.prod.yml` já vem configurado com:
1. **Zero build na VPS**: Puxa imagens pré-compiladas do GitHub Container Registry (GHCR), sem sobrecarregar a CPU.
2. **MinIO Local Integrado**: Storage S3-compatible rodando na VPS com volume dedicado persistente (`evorix_miniodata`).
3. **Limites de Memória**: Restrições estritas para proteger o kernel e evitar que memory leaks travem o servidor.

| Contêiner | Função | Porta Interna / Web | Limite de RAM |
| :--- | :--- | :--- | :--- |
| `evorix_minio` | Armazenamento S3 de Fotos e Laudos | `9000` (API) / `9001` (Console Web) | **512 MB** |
| `evorix_whatsapp` | Evolution API (WhatsApp) | `8080` | **1024 MB** |
| `evorix_web` | Frontend Next.js Standalone | `3000` | **1024 MB** |
| `evorix_api` | Backend NestJS + Fastify | `3001` | **1024 MB** |
| `evorix_postgres` | Banco PostgreSQL 16 | `5432` | **1024 MB** |
| `evorix_redis` | Cache & Filas BullMQ | `6379` | **256 MB** |
| `evorix_nginx` | Gateway Edge HTTP/HTTPS | `80` / `443` | **128 MB** |

### Executando com 1 Comando:
```bash
# Executa o script automatizado de pull e deploy:
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh
```

Ou manualmente via Docker Compose:
```bash
# Baixar imagens do GHCR
docker compose -f docker-compose.prod.yml --env-file .env.production pull

# Subir contêineres em segundo plano
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --remove-orphans

# Verificar status de saúde dos contêineres
docker compose -f docker-compose.prod.yml ps
```

---

## 5. Aplicação das Migrações do PostgreSQL

Após a inicialização do banco, as migrações Prisma são aplicadas automaticamente pelo script de deploy, ou manualmente:

```bash
docker compose -f docker-compose.prod.yml exec evorix_api npx prisma migrate deploy --schema=./prisma/schema.postgresql.prisma
```

---

## 6. Configuração de Domínio e Certificado SSL Gratuito (Let's Encrypt)

Para disponibilizar seu sistema sob um domínio próprio seguro (ex.: `app.suaempresa.com.br`):

### Passo A: Aponte o DNS
Crie um registro do tipo `A` no seu provedor de DNS (Cloudflare, Registro.br, GoDaddy):
- **Nome/Host**: `app` (ou `@`)
- **Valor/Destino**: Endereço IP público do seu servidor VPS.

### Passo B: Certbot com Nginx
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Parar temporariamente a porta 80 do docker para emissão inicial do certificado
docker compose stop evorix_nginx

# Emitir certificado SSL
sudo certbot certonly --standalone -d app.suaempresa.com.br --non-interactive --agree-tos -m financeiro@suaempresa.com.br

# Reativar o Nginx
docker compose start evorix_nginx
```

Para integrar o SSL diretamente no Nginx do Docker, basta mapear o volume dos certificados `/etc/letsencrypt` para `/etc/letsencrypt:ro` dentro do serviço `evorix_nginx` no `docker-compose.yml` e ativar as diretivas `ssl_certificate` no `docker/nginx/nginx.conf`.

---

## 7. Rotina de Backup Automático do PostgreSQL (Diário)

Evite perda de dados criando um script de backup automático diário agendado via Cron:

```bash
# Criar diretório de backups
sudo mkdir -p /var/backups/evorix
sudo chmod 700 /var/backups/evorix

# Criar script de dump
sudo nano /usr/local/bin/evorix-backup.sh
```

Cole o conteúdo:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/evorix"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/evorix_db_$TIMESTAMP.sql.gz"

# Realiza o dump compactado via Docker
docker compose -f /opt/evorix/docker-compose.yml exec -T evorix_postgres pg_dump -U evorix_user evorix_db | gzip > "$FILENAME"

# Mantém apenas os últimos 14 dias de backup
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete

echo "Backup concluído com sucesso: $FILENAME"
```

Torne o script executável e adicione ao Cron:
```bash
sudo chmod +x /usr/local/bin/evorix-backup.sh

# Adicionar agendamento diário às 03:00 da madrugada
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/evorix-backup.sh >> /var/log/evorix-backup.log 2>&1") | crontab -
```

---

## 8. Comandos de Manutenção e Atualização

### Atualizar o Software para uma Nova Versão (Zero-Downtime / Rápido)
Como o GitHub Actions gera as imagens no GHCR, a atualização na VPS não compila nada:
```bash
cd /opt/evorix
git pull origin main

# Puxa as novas imagens pré-compiladas
docker compose -f docker-compose.prod.yml --env-file .env.production pull

# Reinicia os contêineres com a nova versão
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --remove-orphans

# Executa migrações pendentes do banco
docker compose -f docker-compose.prod.yml exec evorix_api npx prisma migrate deploy --schema=./prisma/schema.postgresql.prisma
```

### Visualizar Logs em Tempo Real
```bash
# Logs de todos os contêineres
docker compose -f docker-compose.prod.yml logs -f

# Logs apenas da API NestJS
docker compose -f docker-compose.prod.yml logs -f evorix_api

# Logs do Frontend Next.js
docker compose -f docker-compose.prod.yml logs -f evorix_web
```

---

## 9. Suporte a Pagamentos PIX & Webhook

O EVORIX gera chaves PIX dinâmicas e estáticas no padrão oficial do Banco Central do Brasil (**EMVCo BR Code com CRC16 CCITT**).

Para processamento bancário em tempo real:
1. Configure sua chave no painel de **Configurações do Tenant** (`/configuracoes`).
2. Cadastre a URL pública do seu webhook na sua instituição financeira (ex.: Mercado Pago, Efí Bank, Asaas, Itaú, Cora):
   - **URL do Webhook**: `https://app.suaempresa.com.br/api/v1/finance/pix/webhook`
3. Assim que o cliente pagar a OS pelo QR Code da impressão térmica, da ordem impressa ou do Portal Público, a baixa financeira é instantânea e o status da OS migra automaticamente para `PRONTO_PARA_RETIRADA` ou `FINALIZADO`.
