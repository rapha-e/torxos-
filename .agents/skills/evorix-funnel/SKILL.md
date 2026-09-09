---
name: evorix-funnel
description: Gerencia e otimiza o Funil de Vendas, Landing Page (/lp), rastreamento Meta Pixel/GTM e conversões de novos lojistas no Evorix.
---

# Evorix Funnel Skill — Funil de Aquisição e Landing Page

Esta Skill orienta o agente Antigravity a criar, monitorar e otimizar as páginas de captura e conversão do SaaS Evorix voltadas para donos de assistências técnicas.

## 📍 Arquitetura da Etapa 1

1. **Página de Captura / Landing Page:**
   - Localização: `apps/web/src/app/(public)/lp/page.tsx`
   - URL Pública: `/lp`
   - Design: Dark mode executivo (`#0C0C0E`), acentos em âmbar/dourado e esmeralda, glassmorphism e tipografia premium.
   - Seções estruturadas no modelo AIDA/PAS:
     - Hero com proposta de valor clara e sem fricção ("7 dias grátis sem cartão").
     - Mockup interativo da bancada digital (Kanban + WhatsApp + AI Mentor + DRE).
     - As 4 maiores dores reais de assistência técnica e a solução Evorix.
     - Tabela comparativa (Caderno/Sistemas legados vs. Evorix).
     - Tabela de preços transparente (Starter R$ 97, Pro R$ 197, Enterprise R$ 347).
     - Depoimentos reais de técnicos e donos de lojas.
     - FAQ com respostas às maiores objeções de compra.

2. **Rastreamento de Tráfego Pago & Conversão:**
   - Componente: `apps/web/src/components/analytics/pixel.tsx`
   - Variáveis de ambiente no `.env`:
     - `NEXT_PUBLIC_META_PIXEL_ID`: ID do Pixel do Facebook/Instagram Ads.
     - `NEXT_PUBLIC_GTM_ID`: ID do Google Tag Manager / Google Ads.
   - Eventos disparados:
     - `PageView`: disparado automaticamente ao carregar a página.
     - `Lead`: disparado ao clicar em qualquer CTA de teste grátis com o plano selecionado.
     - `InitiateCheckout` / `CompleteRegistration`: integrado na finalização do cadastro.

3. **Integração com o Fluxo de Cadastro:**
   - Rota: `/cadastrar?plan=STARTER|PRO|ENTERPRISE`
   - O formulário lê o parâmetro de URL e já seleciona o plano escolhido pelo visitante na Landing Page.

## 🎯 Instruções para o Agente em Testes A/B e Otimizações

Quando o usuário solicitar melhorias ou novas versões da Landing Page:
- Manter o tempo de carregamento inferior a 1.5s (páginas estáticas SSG).
- Focar sempre na linguagem do técnico de bancada: falar de "telas touch", "baterias", "garantia", "laudo", "WhatsApp de retirada".
- Garantir que qualquer botão de conversão chame `trackConversion('Lead', planName)`.
