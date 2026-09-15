# 📘 Guia Oficial & Manual de Operação — TorxOS
### O Sistema de Gestão e Bancada Especializado para Assistências Técnicas

---

## 🌟 Bem-vindo ao TorxOS!

O **TorxOS** foi desenvolvido exclusivamente para resolver as reais dores do dia a dia de uma assistência técnica de celulares, informática e eletrônicos. Com ele, você elimina a desorganização de bancada, acaba com as dúvidas e discussões com clientes sobre o estado físico de aparelhos, acelera o atendimento no balcão e tem controle absoluto do seu dinheiro e estoque.

---

## 📑 Sumário

1. [Acesso à Plataforma & Primeiros Passos](#1-acesso-à-plataforma--primeiros-passos)
2. [Ordens de Serviço (OS) & Gestão de Bancada](#2-ordens-de-serviço-os--gestão-de-bancada)
   - [2.1 Abertura de Nova OS](#21-abertura-de-nova-os)
   - [2.2 Kanban Visual da Bancada](#22-kanban-visual-da-bancada)
   - [2.3 Fotos do Aparelho & Termo de Entrada](#23-fotos-do-aparelho--termo-de-entrada)
   - [2.4 Link de Rastreamento no WhatsApp](#24-link-de-rastreamento-no-whatsapp)
3. [Frente de Caixa (PDV) — Vendas Rápidas de Balcão](#3-frente-de-caixa-pdv--vendas-rápidas-de-balcão)
   - [3.1 Atalhos de Teclado no Balcão (F3, F4, F8)](#31-atalhos-de-teclado-no-balcão)
   - [3.2 Cadastro Rápido de Produtos & Cálculo de Margem](#32-cadastro-rápido-de-produtos--cálculo-de-margem)
   - [3.3 Fechamento de Venda & Impressão Térmica](#33-fechamento-de-venda--impressão-térmica)
4. [Gestão de Estoque & Peças de Reposição](#4-gestão-de-estoque--peças-de-reposição)
   - [4.1 Precificação Inteligente Bidirecional](#41-precificação-inteligente-bidirecional)
   - [4.2 Localização Física (Gavetas & Prateleiras)](#42-localização-física)
   - [4.3 Prevenção de Ruptura](#43-prevenção-de-ruptura)
5. [Controle Financeiro & Fluxo de Caixa](#5-controle-financeiro--fluxo-de-caixa)
   - [5.1 Caixa Balcão (Gaveta)](#51-caixa-balcão-gaveta)
   - [5.2 Extrato Realizado vs Projeção Futura](#52-extrato-realizado-vs-projeção-futura)
6. [Mentor de Inteligência Artificial](#6-mentor-de-inteligência-artificial)
7. [Suporte & Ajuda em Tempo Real](#7-suporte--ajuda-em-tempo-real)

---

## 1. Acesso à Plataforma & Primeiros Passos

### Como acessar:
1. Abra o navegador do seu computador, tablet ou smartphone e acesse:  
   👉 **[https://torxos.tech/login](https://torxos.tech/login)**
2. Digite o **E-mail** e a **Senha** cadastrados na criação da conta.
3. Seus 7 dias de teste gratuito liberam acesso irrestrito a todas as funcionalidades profissionais da plataforma.

> [!TIP]
> **Adicione à barra de favoritos:** No Google Chrome ou Edge, pressione `Ctrl + D` para salvar o TorxOS nos seus favoritos e abrir o sistema com um clique toda manhã.

---

## 2. Ordens de Serviço (OS) & Gestão de Bancada

A Ordem de Serviço é a espinha dorsal de qualquer assistência técnica profissional.

### 2.1 Abertura de Nova OS (`/os/nova`)
Para dar entrada no aparelho de um cliente:
1. No menu lateral, clique em **"Ordens de Serviço"** ➔ **"Nova OS"** (ou use o botão rápido de entrada).
2. **Dados do Cliente:** Digite o nome e o WhatsApp do cliente com DDD. O sistema aplica máscara automática. Se o cliente já foi cadastrado antes, o sistema localiza os dados instantaneamente.
3. **Dados do Equipamento:**
   - Tipo de aparelho (Smartphone, Notebook, Tablet, Smartwatch, etc.).
   - Marca e Modelo (Ex.: *Apple iPhone 13 128GB*, *Samsung Galaxy S22*).
   - Cor e IMEI/Número de Série.
4. **Relato do Cliente & Defeito:** Descreva o problema alegado pelo cliente (ex: *"Aparelho não carrega e tela pisca verde após queda"*).
5. **Checklist de Entrada:** Marque o estado do aparelho (Liga? Carrega? Tela trincada? Molhou? Tem senha de desbloqueio?).

---

### 2.2 Kanban Visual da Bancada (`/os/kanban`)
O Kanban organiza o fluxo de trabalho dos técnicos em colunas simples e intuitivas:

| Estágio | O que significa? |
| :--- | :--- |
| **Entrada / Análise** | Aparelho recém-chegado à loja aguardando abertura ou laudo técnico. |
| **Aguardando Aprovação** | Orçamento gerado pelo técnico aguardando o "OK" do cliente. |
| **Em Reparo / Aguardando Peça** | O técnico está trabalhando no conserto ou aguardando chegada de peças. |
| **Pronto para Retirada** | Aparelho reparado, higienizado e testado na bancada, pronto para entrega. |
| **Entregue / Concluído** | Aparelho entregue ao cliente, com garantia ativada e valor recebido no caixa. |

*Você pode arrastar e soltar os cartões de OS entre as colunas conforme o serviço avança!*

---

### 2.3 Fotos do Aparelho & Proteção de Entrada
> [!IMPORTANT]
> **A maior causa de prejuízo em bancada são reclamações sobre marcas ou peças que supostamente funcionavam antes da entrada.**
- Na abertura da OS, tire até 4 fotos do aparelho (Frente, Traseira, Lateral e Detalhe).
- As fotos ficam anexadas para sempre no laudo digital da OS.

---

### 2.4 Link de Rastreamento no WhatsApp (Fim do *"Já tá pronto?"*)
- A cada mudança de status ou orçamento aprovado, o cliente recebe uma mensagem automática no WhatsApp contendo um **link exclusivo de acompanhamento**.
- Ao clicar, o cliente vê fotos, laudo e status sem precisar ligar ou mandar mensagem repetida para a loja.

---

## 3. Frente de Caixa (PDV) — Vendas Rápidas de Balcão

O **PDV do TorxOS** (`/vendas/pdv`) foi desenhado para você atender seu cliente de balcão (películas, capinhas, cabos e fones) em menos de 15 segundos.

```
       [F3] Cadastrar Produto Rápido
       [F4] Buscar / Bipar Código de Barras
       [F8] Fechar e Receber Venda
```

### 3.1 Atalhos Rápidos de Teclado
- **F3:** Abre o modal de cadastro rápido sem precisar sair da tela de venda.
- **F4:** Coloca o cursor direto no campo de busca ou leitor de código de barras.
- **F8:** Abre a tela de pagamento imediato.
- **Esc:** Fecha qualquer janela ou modal aberto.

---

### 3.2 Cadastro Rápido de Produtos com Cálculo Inteligente de Lucro
Ao cadastrar um produto novo no balcão (**F3**):
1. Digite o **Nome do Produto** (ex: *Capa MagSafe Transparente iPhone 14*).
2. Informe o **Preço de Custo (R$)** (ex: `R$ 15,00`).
3. Digite a **Margem desejada (%)** (ex: `100%`) ➔ O sistema calcula o **Preço de Venda** automaticamente (`R$ 30,00`).
   *(Ou digite o Preço de Venda que a Margem será calculada de volta!)*
4. **Card de Lucro Bruto:** Um badge verde confirma exatamente quanto você lucra na unidade:
   > 🟢 **Lucro Bruto Unitário: R$ 15,00** `[ +100% Margem ]`
5. Deixe marcado *"Adicionar 1 unidade ao carrinho imediatamente"* e clique em **Salvar e Inserir no PDV**.

---

### 3.3 Fechamento de Venda & Recibo Térmico
- Pressione **F8**.
- Escolha a forma de pagamento: **Dinheiro**, **PIX**, **Cartão de Crédito** ou **Débito**.
- Em dinheiro, informe o valor entregue pelo cliente e o sistema calcula o troco na hora.
- Clique em **Finalizar Venda**:
  - A baixa é feita no estoque.
  - O valor entra imediatamente no **Caixa Gaveta Balcão**.
  - Um cupom de venda (formato térmico 80mm/58mm) fica disponível para impressão com garantia e identificação da sua loja.

---

## 4. Gestão de Estoque & Peças de Reposição (`/estoque`)

Evite compras desnecessárias e nunca fique sem peças essenciais de alto giro (telas de iPhone, conectores Type-C, baterias e películas).

### 4.1 Precificação Inteligente
No módulo de Estoque, o cadastro de peças conta com cálculo bidirecional com três indicadores:
- **Custo de Compra (CMV)**
- **Margem de Contribuição (%)**
- **Preço de Venda / Balcão (R$)**

### 4.2 Localização Física (Gaveta / Prateleira)
Nunca perca tempo procurando uma tela no estoque:
- Ao cadastrar a peça, preencha o campo **Localização** (ex: *Gaveta A-03*, *Caixa Baterias 01*).
- Na abertura da OS ou no balcão, o sistema mostra exatamente em qual gaveta a peça está guardada.

---

## 5. Controle Financeiro & Fluxo de Caixa (`/financeiro`)

O módulo financeiro do TorxOS garante que você saiba para onde cada centavo da sua assistência técnica está indo.

### 5.1 Caixa Balcão (Gaveta)
- Toda venda concluída no PDV e toda Ordem de Serviço paga à vista alimenta automaticamente o saldo da conta **Caixa Gaveta Balcão**.
- Não é necessário lançar entradas manualmente.

### 5.2 Extrato Realizado vs Projeção Futura
Na tela de **Fluxo de Caixa** (`/financeiro/fluxo-caixa`), você conta com abas dedicadas:
1. **Extrato Realizado no Caixa:** Mostra as entradas e saídas que efetivamente já ocorreram em dinheiro, Pix e cartões.
2. **Previsão Futura:** Mostra os compromissos a vencer (aluguel, fornecedores de peças, ferramentas) e títulos a receber nos próximos 30, 60 e 90 dias.

---

## 6. Mentor de Inteligência Artificial (`/mentor`)

O TorxOS possui um consultor de negócios integrado com inteligência artificial treinado no modelo operacional de assistências técnicas de alta rentabilidade:
- **Briefing Diário:** Analisa seu dia e sugere aparelhos parados na bancada que precisam de contato com o cliente.
- **Copywriter de Orçamento:** Escreve mensagens explicativas e profissionais para você enviar ao cliente explicando a diferença entre uma tela original/premium e uma réplica.

---

## 7. Suporte & Ajuda em Tempo Real

Teve qualquer dúvida operacional ou precisa de suporte no sistema?
- Em qualquer tela do sistema, olhe para o canto inferior direito:
  - Há um botão flutuante preto com detalhe dourado: **"Suporte & Ajuda"**.
- Ao clicar nele:
  - Seu nome de operador e a sua empresa são identificados automaticamente.
  - Selecione se é uma **Dúvida Operacional** ou **Manutenção no Sistema**.
  - Digite sua mensagem e clique em **Iniciar Atendimento**.
  - O WhatsApp oficial do suporte TorxOS será aberto diretamente com tudo preenchido para você ser atendido em poucos minutos.

---

### 🚀 Dica de Ouro para o Gestor:
> Crie o hábito de atualizar o status de cada aparelho na bancada logo após o reparo. Seus clientes vão se surpreender com a transparência do link de acompanhamento e o número de ligações e mensagens na sua loja cairá drasticamente!

**Equipe TorxOS — Gestão Profissional para Assistências Técnicas**  
Suporte Oficial: `(61) 99229-5814` • [https://torxos.tech](https://torxos.tech)
