---
name: evorix-onboarding-crm
description: Gerenciamento da régua de ativação de lojistas, automação de disparos de WhatsApp de onboarding (D0 a D7) e acompanhamento de conversões de trial para assinante pagante no Evorix.
---

# Evorix Onboarding & CRM de Ativação (Etapa 5)

Esta skill orienta o agente Antigravity a gerenciar o funil de ativação de novos lojistas que se cadastram pelo site/Landing Page (`/lp` ou `/cadastrar`). O objetivo é garantir que 100% dos novos usuários experimentem o valor do software nos 7 dias de teste gratuito e convertam em assinantes pagantes recorrentes no Asaas.

---

## 🎯 Régua de Ativação de 7 Dias (WhatsApp & E-mail)

| Estágio | Gatilho | Foco do Conteúdo | Ação Esperada do Lojista |
|---|---|---|---|
| **D0** | Imediato ao cadastrar | Boas-vindas calorosa, link de login e tour rápido de 3 min | Fazer o 1º login e assistir ao tour |
| **D1** | 24h após cadastro | Dica de bancada: Fotos do aparelho na entrada da OS | Cadastrar a 1ª Ordem de Serviço com fotos |
| **D3** | 72h após cadastro | Link de rastreamento online da OS no WhatsApp do cliente | Testar o status online e economizar tempo |
| **D5** | 48h para vencer o Trial | Alerta de que faltam 2 dias para encerrar o teste VIP | Revisar dados cadastrados e preparar assinatura |
| **D7** | Dia do vencimento | Conversão: Link direto para ativar a mensalidade Asaas | Pagar fatura/assinatura (Pix, Cartão ou Boleto) |

---

## 🛠️ Endpoints da API NestJS (`OnboardingModule`)

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/v1/onboarding/pipeline` | `GET` | Retorna todos os lojistas em Trial agrupados por estágio (D0 a D7) com links diretos de WhatsApp. |
| `/api/v1/onboarding/dispatch` | `POST` | Dispara manualmente ou reenvia a mensagem de um estágio específico. |
| `/api/v1/onboarding/config` | `GET/POST` | Consulta ou atualiza os endpoints da Evolution API / Webhook n8n. |

---

## ⏰ Rotina de Auditoria Matinal com `/schedule`

Você pode configurar o Antigravity para rodar um check diário das lojas em Trial:

```
/schedule cron="0 9 * * *" prompt="Consultar /api/v1/onboarding/pipeline no Evorix, identificar lojas em D5 e D7 que precisam de contato comercial e notificar o Super Admin"
```

> **Ação do Agente:** Todos os dias às 09:00, o agente checa quais assistências estão a 48h ou 24h de vencer o teste grátis e prepara os links rápidos do WhatsApp para o dono do Evorix fechar as assinaturas.
