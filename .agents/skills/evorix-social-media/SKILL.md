---
name: evorix-social-media
description: Criação de conteúdo educativo, geração de carrosséis para Instagram (com artes SVG) e automação de postagens para o nicho de assistência técnica do Evorix.
---

# Evorix Social Media & Automação de Postagens (Etapa 4)

Esta skill orienta o agente Antigravity a produzir conteúdos orgânicos e educativos de alta retenção no Instagram, LinkedIn e Facebook, focados em donos e técnicos de assistência técnica de celulares e informática.

---

## 🎯 Objetivos da Skill

1. **Posicionamento de Autoridade:** Gerar carrosséis com dicas reais de bancada, gestão financeira de oficina e atendimento via WhatsApp.
2. **Atração para o Funil de Vendas:** Cada post termina com um CTA claro direcionando para o teste grátis de 7 dias na Landing Page (`https://evorix.com.br/lp`).
3. **Automação Contínua:** Agendar tarefas recorrentes no Antigravity via `/schedule` para abastecer as redes toda semana sem intervenção manual.

---

## 🛠️ Ferramentas & Scripts Disponíveis

### 1. Script CLI Rápido (`scripts/social/generate-posts.js`)
Gera carrosséis completos com slides renderizados em SVG de 1080x1080px e legendas formatadas com hashtags.

```bash
# Gerar a grade semanal completa (Segunda, Quarta e Sexta):
node scripts/social/generate-posts.js --week

# Gerar carrossel específico de bancada técnica:
node scripts/social/generate-posts.js --pillar=BANCADA_TECNICA

# Gerar carrossel de finanças e precificação de oficina:
node scripts/social/generate-posts.js --pillar=GESTAO_OFICINA
```

Os arquivos de saída ficam salvos em: `content/social/posts/`.

---

## 🌐 Endpoints da API NestJS (`SocialModule`)

Todos os endpoints estão documentados no Swagger (`/api/docs`):

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/v1/social/presets` | `GET` | Retorna dores de bancada, pilares e hashtags recomendadas. |
| `/api/v1/social/generate-carousel` | `POST` | Gera carrossel customizado com slides e SVGs em JSON. |
| `/api/v1/social/generate-weekly-pack` | `POST` | Gera a grade com 3 carrosséis estratégicos da semana. |
| `/api/v1/social/dispatch-webhook` | `POST` | Dispara o post para um webhook (n8n, Make, Buffer). |

---

## ⏰ Como Agendar com o `/schedule` do Antigravity

Você pode recomendar ao usuário ou configurar diretamente o agendamento semanal de geração de posts:

```
/schedule cron="0 8 * * 1" prompt="Gerar novo pacote semanal de carrosséis para o Instagram do Evorix via scripts/social/generate-posts.js --week e notificar o resumo"
```

> **Explicação:** Roda toda segunda-feira às 08:00 da manhã, gerando 3 carrosséis completos com as artes SVG e legendas prontas para postagem.

---

## 📐 Estrutura de um Carrossel de Alta Conversão

- **Slide 1 (Capa):** Gancho forte e específico (ex: *"A Matemática da Troca de Tela: Quanto Realmente Sobra?"*).
- **Slides 2 a 5 (Desenvolvimento):** Dicas práticas e diretas ao ponto, com números reais de bancada.
- **Slide Final (CTA):** Convite para abandonar o papel e testar o Evorix por 7 dias grátis com link na bio.
