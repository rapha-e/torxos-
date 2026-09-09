---
name: evorix-traffic-copy
description: Gera copys de alta conversão, roteiros para Meta Ads/Google Ads e payloads prontos para o funil de tráfego pago do Evorix.
---

# Evorix Traffic & Copy Engine Skill

Esta Skill orienta o agente Antigravity a criar, testar e otimizar campanhas de tráfego pago (Meta Ads e Google Ads) voltadas para aquisição de novos lojistas de assistência técnica para o Evorix.

## 🎯 Personas e Dores Mapeadas no Mercado

1. **Dono de Assistência Técnica (ICP Principal):**
   - Perfil: Técnico que começou na bancada e hoje tem 1 a 5 funcionários. Fatura de R$ 15k a R$ 80k/mês.
   - Maior Medo: Tomar prejuízo com garantias, ser roubado em peças/estoque, processo de cliente por avaria prévia.
   - Maior Desejo: Bancada organizada, clientes satisfeitos que não incomodam no WhatsApp e previsibilidade de lucro no fim do mês.

## 🛠️ Ferramentas & Automações Disponíveis

### 1. Script CLI de Geração Automática de Anúncios
Para gerar novas variações de anúncios pelo terminal ou via tarefa agendada:

```bash
# Foco em Estoque & Peças que somem:
node scripts/growth/generate-ads.js --focus=ESTOQUE

# Foco em WhatsApp & Status de OS:
node scripts/growth/generate-ads.js --focus=OS_WHATSAPP

# Foco em Gestão Financeira & Lucro Real (DRE):
node scripts/growth/generate-ads.js --focus=FINANCEIRO_DRE
```

Os anúncios são salvos automaticamente em:
- `content/ads/campanha_[foco]_[data].json` (estruturado para automações)
- `content/ads/campanha_[foco]_[data].md` (formatado para leitura humana e cópia rápida)

### 2. API NestJS do Evorix (`GrowthModule`)
- `GET /api/v1/growth/presets` — Retorna as dores de bancada mapeadas e a oferta ativa.
- `POST /api/v1/growth/generate-ads` — Gera variações via IA (Gemini) ou motor algorítmico com corpo `{ focus, channel, framework, count }`.
- `POST /api/v1/growth/meta-payload` — Gera o payload JSON oficial pronto para envio à **Meta Marketing API** (`POST /act_{ad_account_id}/campaigns`).

## 📋 Regras de Ouro de Copywriting para o Evorix

1. **Falar a Linguagem da Bancada:**
   - Use termos reais: *"solda", "estação de retrabalho", "troca de frontal", "conector de carga", "tela OLED", "banho químico", "bateria 100% saúde"*.
2. **Framework PAS (Problema - Agitação - Solução):**
   - Abra com um gancho doloroso nos primeiros 3 segundos ou nas 2 primeiras linhas.
   - Agite a consequência (vergonha com cliente, prejuízo no bolso).
   - Apresente o Evorix como o alívio imediato com 7 dias grátis.
3. **Chamada para Ação Clara (CTA):**
   - Aponte sempre para a Landing Page de alta conversão: `https://app.evorix.com.br/lp`.
   - Ressalte o selo de confiança: *"Sem cartão de crédito • Comece em 1 minuto"*.
