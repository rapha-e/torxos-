# Guia de Implantação do EVORIX no Google Cloud Platform (GCP)

Este guia apresenta as duas arquiteturas oficiais para hospedar o **EVORIX Business Operating Platform** no **Google Cloud**, desde a opção **Serverless (Cloud Run)** de alta escala até a opção de **Servidor Dedicado (Compute Engine)** de menor custo inicial.

---

## Comparativo de Arquiteturas no Google Cloud

| Critério | Opção 1: Google Cloud Run (Serverless) ⭐ **Recomendada** | Opção 2: Google Compute Engine (VM com Docker) |
| :--- | :--- | :--- |
| **Público-alvo** | Operação Enterprise, escalabilidade infinita, zero manutenção de SO | Menor custo fixo inicial, controle total em 1 único servidor |
| **Frontend & API** | **Google Cloud Run** (Next.js Standalone + NestJS Fastify) | Contêineres Docker orquestrados via `docker-compose.yml` |
| **Banco de Dados** | **Cloud SQL for PostgreSQL 16** (com backups e réplicas automáticas) | Contêiner PostgreSQL interno ou Cloud SQL |
| **Armazenamento de Fotos** | **Google Cloud Storage (GCS)** com durabilidade 99.999999999% | Cloud Storage (GCS) ou MinIO interno |
| **Certificado SSL** | **100% Automático e Gratuito** gerenciado pelo Google | Let's Encrypt gratuito com Nginx ou Cloud Load Balancer |
| **Escala** | Escala de 0 a centenas de instâncias conforme a demanda (paga só pelo uso) | Instância fixa (escala vertical alterando o tamanho da VM) |
| **Custo Estimado** | Gratuito no Free Tier (depois ~$15 a $35/mês com Cloud SQL db-f1-micro) | ~$20 a $30/mês (instância `e2-medium` ou `e2-standard-2`) |

---

## OPÇÃO 1: Implantação Serverless com Google Cloud Run (Recomendada)

Nesta arquitetura moderna, tanto a API NestJS quanto o Frontend Next.js rodam no **Google Cloud Run** em contêineres Docker leves, com certificados HTTPS automáticos e auto-scaling.

### Passo 1: Instalação da CLI `gcloud` e Login
Se ainda não tiver o SDK do Google Cloud no seu computador:
1. Baixe o instalador oficial em: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. Abra o terminal e autentique sua conta Google:
```bash
gcloud auth login
gcloud auth configure-docker southamerica-east1-docker.pkg.dev
```

### Passo 2: Criar e Selecionar o Projeto no GCP
```bash
# Definir variáveis
PROJECT_ID="evorix-production-$(date +%s)"
REGION="southamerica-east1" # Região de São Paulo (menor latência no Brasil)

# Criar o projeto
gcloud projects create $PROJECT_ID --name="EVORIX Platform"
gcloud config set project $PROJECT_ID

# Vincular sua conta de faturamento (obrigatório para Cloud Run e Cloud SQL)
# gcloud beta billing projects link $PROJECT_ID --billing-account=SEU_BILLING_ACCOUNT_ID
```

### Passo 3: Ativar as APIs Necessárias
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com
```

### Passo 4: Criar Repositório de Imagens no Artifact Registry
```bash
gcloud artifacts repositories create evorix-repo \
  --repository-format=docker \
  --location=$REGION \
  --description="Imagens Docker do EVORIX"
```

### Passo 5: Criar Bucket no Cloud Storage (GCS) para Laudos e Fotos
```bash
BUCKET_NAME="evorix-media-${PROJECT_ID}"
gcloud storage buckets create gs://$BUCKET_NAME --location=$REGION --uniform-bucket-level-access
```

### Passo 6: Provisionar Banco de Dados Cloud SQL (PostgreSQL 16)
```bash
# Cria a instância gerenciada do PostgreSQL 16
gcloud sql instances create evorix-db-instance \
  --database-version=POSTGRES_16 \
  --tier=db-custom-2-7680 \
  --region=$REGION \
  --storage-size=20GB \
  --storage-auto-increase \
  --root-password="GereUmaSenhaForteAqui123"

# Cria a base de dados do tenant
gcloud sql databases create evorix_db --instance=evorix-db-instance

# Cria o usuário do banco
gcloud sql users create evorix_user \
  --instance=evorix-db-instance \
  --password="SenhaSeguraParaOEvorixBanco"
```

### Passo 7: Criar Segredos no Secret Manager
```bash
# JWT Secret
echo -n "chave_jwt_super_secreta_de_producao_2026_evorix" | \
  gcloud secrets create evorix-jwt-secret --data-file=-

# Gemini API Key
echo -n "SUA_CHAVE_GEMINI_API_AQUI" | \
  gcloud secrets create evorix-gemini-key --data-file=-
```

### Passo 8: Build e Deploy da API NestJS no Cloud Run
```bash
# Compilar e enviar imagem Docker da API
IMAGE_API="${REGION}-docker.pkg.dev/${PROJECT_ID}/evorix-repo/evorix-api:v1"

docker build -t $IMAGE_API -f apps/api/Dockerfile .
docker push $IMAGE_API

# Fazer o deploy no Cloud Run
gcloud run deploy evorix-api \
  --image=$IMAGE_API \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3001 \
  --memory=1Gi \
  --cpu=1 \
  --set-env-vars="NODE_ENV=production,PORT=3001,MINIO_BUCKET_NAME=${BUCKET_NAME}" \
  --set-secrets="JWT_SECRET=evorix-jwt-secret:latest,GEMINI_API_KEY=evorix-gemini-key:latest" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:evorix-db-instance" \
  --set-env-vars="DATABASE_URL=postgresql://evorix_user:SenhaSeguraParaOEvorixBanco@localhost:5432/evorix_db?host=/cloudsql/${PROJECT_ID}:${REGION}:evorix-db-instance"
```
O comando retornará a URL pública HTTPS da API (ex.: `https://evorix-api-xyz-rj.a.run.app`).

### Passo 9: Build e Deploy do Frontend Next.js no Cloud Run
```bash
API_URL="https://evorix-api-xyz-rj.a.run.app/api/v1"
IMAGE_WEB="${REGION}-docker.pkg.dev/${PROJECT_ID}/evorix-repo/evorix-web:v1"

# Compilar apontando para a URL da API
docker build --build-arg NEXT_PUBLIC_API_URL=$API_URL -t $IMAGE_WEB -f apps/web/Dockerfile .
docker push $IMAGE_WEB

# Deploy do Frontend
gcloud run deploy evorix-web \
  --image=$IMAGE_WEB \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --port=3000 \
  --memory=1Gi \
  --cpu=1
```
O comando retornará a URL pública do seu software (ex.: `https://evorix-web-xyz-rj.a.run.app`).

### Passo 10: Mapear seu Domínio Próprio (ex.: `app.suaempresa.com.br`)
No console do Cloud Run:
1. Vá em **Cloud Run** > **Gerenciar Domínios Personalizados**.
2. Clique em **Adicionar Mapeamento**, selecione o serviço `evorix-web` e digite `app.suaempresa.com.br`.
3. O Google fornecerá os registros CNAME para você colar no seu DNS (Cloudflare, Registro.br, GoDaddy). O certificado SSL é provisionado automaticamente em menos de 15 minutos!

---

## OPÇÃO 2: Implantação Rápida em VM Google Compute Engine (Com Docker Compose)

Se você preferir rodar tudo em uma única máquina virtual com custo fixo previsível, usando o `docker-compose.yml` que já deixamos configurado:

### Passo 1: Criar Instância no Compute Engine em São Paulo
```bash
gcloud compute instances create evorix-vm \
  --project=$PROJECT_ID \
  --zone=southamerica-east1-a \
  --machine-type=e2-standard-2 \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-balanced \
  --tags=http-server,https-server
```

### Passo 2: Criar Regras de Firewall para Portas 80 e 443
```bash
gcloud compute firewall-rules create allow-http-https \
  --allow=tcp:80,tcp:443 \
  --target-tags=http-server,https-server
```

### Passo 3: Conectar na Máquina via SSH
```bash
gcloud compute ssh evorix-vm --zone=southamerica-east1-a
```

### Passo 4: Instalar Docker e Iniciar a Stack
Dentro da VM no Google Cloud:
```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Clonar repositório
cd /opt
sudo git clone https://github.com/seu-usuario/evorix.git
sudo chown -R $USER:$USER /opt/evorix
cd /opt/evorix

# 3. Subir toda a infraestrutura com 1 comando
docker compose up -d --build

# 4. Executar migrações do banco
docker compose exec evorix_api npx prisma migrate deploy --schema=./prisma/schema.postgresql.prisma
docker compose exec evorix_api npm run prisma:seed
```

Pronto! Seu sistema estará no ar no IP externo da VM na porta 80/443 com Nginx, Next.js, NestJS, PostgreSQL e Redis.
