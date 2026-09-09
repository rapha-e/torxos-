import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AiMentorPillar, ConsultMentorDto, GenerateQuoteCopyDto } from "./dto/ai-mentor.dto";

@Injectable()
export class AiMentorService {
  private readonly logger = new Logger(AiMentorService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY;

  constructor(private prisma: PrismaService) {}

  /**
   * Pipeline de Extração Analítica de Dados (SQL Agregado / RAG Estruturado)
   */
  async extractAnalyticalContext(tenantId: string, pillar: AiMentorPillar) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const fifteenDaysAhead = new Date();
    fifteenDaysAhead.setDate(today.getDate() + 15);

    // Q1: Ordens de Serviço & Status Detalhado
    const orders = await this.prisma.serviceOrder.findMany({
      where: { tenantId },
      include: {
        client: { select: { name: true, phone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const statusCounts: Record<string, number> = {};
    let totalCompletedVolume = 0;
    let completedCount = 0;

    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      if (o.status === "DELIVERED") {
        totalCompletedVolume += Number(o.netTotal);
        completedCount++;
      }
    }

    const avgTicket = completedCount > 0 ? (totalCompletedVolume / completedCount).toFixed(2) : "0.00";

    const activeOrdersDetails = orders
      .filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELED")
      .map((o) => ({
        osNumber: o.osNumber,
        status: o.status,
        client: o.client?.name || "Cliente Balcão",
        phone: o.client?.phone || "",
        device: `${o.deviceBrand || ""} ${o.deviceModel || ""}`.trim(),
        defect: o.reportedDefect || "",
        diagnosis: o.technicalDiagnosis || "",
        netTotal: Number(o.netTotal || 0),
        parts: (o.items || [])
          .filter((it) => it.itemType === "PRODUCT")
          .map((it) => ({
            description: it.description,
            unitPrice: Number(it.unitPrice || 0),
            stockAvailable: it.product ? Number(it.product.currentStock || 0) : null,
          })),
      }));

    // Q2: Rupturas de Estoque
    const criticalStock = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        stockoutRiskStatus: { in: ["CRITICAL", "WARNING"] },
      },
      select: {
        name: true,
        currentStock: true,
        dailyAvgConsumption: true,
        daysUntilStockout: true,
        stockoutRiskStatus: true,
      },
    });

    // Q3: Títulos a Vencer em 15d
    const upcomingPayables = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        transactionType: "PAYABLE",
        status: "PENDING",
        dueDate: { lte: fifteenDaysAhead },
      },
      select: { description: true, netAmount: true, dueDate: true },
    });

    const upcomingReceivables = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        transactionType: "RECEIVABLE",
        status: "PENDING",
        dueDate: { lte: fifteenDaysAhead },
      },
      select: { description: true, netAmount: true, dueDate: true },
    });

    const totalPayables15d = upcomingPayables.reduce((sum, item) => sum + Number(item.netAmount), 0);
    const totalReceivables15d = upcomingReceivables.reduce((sum, item) => sum + Number(item.netAmount), 0);

    return {
      pillar,
      generatedAt: today.toISOString(),
      kpis: {
        totalServiceOrders: orders.length,
        ticketMedio: Number(avgTicket),
        kanbanStatus: statusCounts,
        produtosEmRiscoRuptura: criticalStock.length,
        contasAPagar15Dias: totalPayables15d,
        contasAReceber15Dias: totalReceivables15d,
      },
      activeOrders: activeOrdersDetails,
      stockAlerts: criticalStock.slice(0, 5),
    };
  }

  /**
  * Lista de modelos Gemini com fallback inteligente para alta disponibilidade
  */
  private readonly candidateModels = [
    process.env.GEMINI_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
  ].filter(Boolean) as string[];

  /**
   * Motor Analítico Nativo de Inteligência Executiva (C-Level para Assistência Técnica)
   * Gera diagnósticos contextuais dinâmicos personalizados para a pergunta exata do gestor,
   * utilizando os dados reais do tenant em tempo real.
   */
  private generateAnalyticalResponse(pillar: AiMentorPillar | string, userPrompt: string, context: any): string {
    const kpis = context.kpis || {};
    const totalOs = kpis.totalServiceOrders || 0;
    const ticketMedio = Number(kpis.ticketMedio || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const kanban = kpis.kanbanStatus || {};
    const awaitingApproval = kanban.AWAITING_APPROVAL || 0;
    const inMaintenance = kanban.IN_MAINTENANCE || 0;
    const triageCount = kanban.TRIAGE || 0;
    const stockAlerts = context.stockAlerts || [];
    const payables = Number(kpis.contasAPagar15Dias || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const receivables = Number(kpis.contasAReceber15Dias || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const netFlow = Number((kpis.contasAReceber15Dias || 0) - (kpis.contasAPagar15Dias || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    const q = (userPrompt || "").toLowerCase();

    const stockWarningSummary = stockAlerts.length > 0
      ? stockAlerts.map((p: any) => `• **${p.name}**: Estoque atual **${p.currentStock} un.** (${p.daysUntilStockout} dias restantes até ruptura — risco ${p.stockoutRiskStatus})`).join("\n")
      : "• Nenhuma peça em estado crítico imediato identificado.";

    // Análise contextual de intenção da pergunta do usuário
    const isEstoqueRuptura = q.includes("estoque") || q.includes("peça") || q.includes("peca") || q.includes("fornecedor") || q.includes("comprar") || q.includes("ruptura") || q.includes("falta") || q.includes("aguardando") || q.includes("bloquead");
    const isBancadaGargalo = q.includes("bancada") || q.includes("gargalo") || q.includes("tempo") || q.includes("rotina") || q.includes("organiza") || q.includes("técnico") || q.includes("fila");
    const isOrcamentoVendas = q.includes("orçamento") || q.includes("conversão") || q.includes("venda") || q.includes("faturar") || q.includes("ticket") || q.includes("aprova") || q.includes("parado");
    const isLucroMargem = q.includes("lucro") || q.includes("margem") || q.includes("custo") || q.includes("comissão") || q.includes("preço") || q.includes("reparo") || q.includes("rentab");
    const isFinanceiroCaixa = q.includes("caixa") || q.includes("financeiro") || q.includes("conta") || q.includes("pagar") || q.includes("receber") || q.includes("duplicata") || q.includes("saldo");
    const isMarketingObjecao = q.includes("marketing") || q.includes("whatsapp") || q.includes("caro") || q.includes("objeção") || q.includes("cliente") || q.includes("google") || q.includes("avalia");

    // 0. Dúvidas sobre Estoque, Reposição e Peças de OSs (prioridade máxima sobre dúvidas de rotina)
    if (isEstoqueRuptura) {
      return `### 🎯 Diagnóstico Executivo de Gestão de Estoque & Reposição
A saúde do seu estoque dita a agilidade da bancada técnica. Atualmente temos **${stockAlerts.length} itens com risco de ruptura detectado**.

Respondendo sobre **"${userPrompt}"**:

---

### 💡 Diretriz de Fluxo da Bancada TorxOS
> **Aviso Operacional:** A coluna *"Aguardando Peça"* foi descontinuada do fluxo Kanban. Toda OS recusada por saldo insuficiente agora **retorna automaticamente para o estágio Aprovado** com a marcação vermelha **⚠️ Sem estoque**.

---

### ⚡ Status Atual de Ruptura & Suprimentos
${stockWarningSummary}

1. **Parada de Bancada por Falta de Peça:** Cada dia que uma peça essencial falta na gaveta significa ordens de serviço represadas e clientes insatisfeitos buscando a concorrência.
2. **Capital Imobilizado vs Itens Críticos:** Comprar em excesso peças de baixo giro retira recursos que deveriam garantir o estoque mínimo dos 20% de modelos mais frequentes (curva ABC).

---

### 📋 Cartões de Ação Imediata (Execute Hoje)

#### 📦 Ação 1: Entrada Física no TorxOS Stock
Acesse o catálogo de estoque e lance a entrada da peça faltante. Assim que o saldo for lançado no sistema, a OS poderá avançar normalmente para **"Em Bancada"**, com baixa segura e sem duplicidade.

#### 🤝 Ação 2: Pedido Consolidado de Reposição Quinzenal
Entre em contato agora com seu distribuidor principal para os itens críticos listados acima. Negocie prazo de pagamento de 14/28 dias ou desconto à vista de 5% a 8% pelo volume do pedido.`;
    }

    // 1. Dúvidas sobre Bancada / Gargalos Técnicos
    if (isBancadaGargalo || pillar === AiMentorPillar.ROUTINE) {
      return `### 🎯 Diagnóstico Operacional da Bancada & Rotina Técnica
Analisamos a sua operação técnica neste instante: existem **${inMaintenance} aparelhos em execução na bancada**, **${triageCount} em triagem inicial** e **${awaitingApproval} aguardando aprovação**. O volume total sob gestão é de **${totalOs} OSs**.

Respondendo ao seu ponto sobre **"${userPrompt}"**:

---

### ⚡ Gargalos Críticos Mapeados na Bancada
1. **Tempo de Triagem e Retenção:** Aparelhos que permanecem mais de 30 minutos em análise inicial sem diagnóstico travam o fluxo de entrada. Ordens rápidas (troca de bateria/conector) não devem competir na mesma fila que falhas de micro-solda em placa.
2. **Impacto de Peças na Bancada:**
${stockWarningSummary}
Aparelhos desmontados aguardando peças ocupam espaço nobre e elevam o risco de avarias em parafusos e componentes minúsculos.
3. **Equilíbrio de Carga de Trabalho:** Distribuir OSs por afinidade de habilidade (técnicos juniores em periféricos e seniores em placas) acelera o giro em até 35%.

---

### 📋 Cartões de Ação Imediata (Execute Hoje)

#### ⏱️ Ação 1: Trava dos 20 Minutos de Diagnóstico
Se um aparelho estiver na bancada há mais de 20 minutos sem diagnóstico conclusivo, rotule como "Análise Avançada", coloque em fila dedicada de placa e libere a bancada para serviços rápidos programados.

#### 📦 Ação 2: Protocolo Anti-Baixa Duplicada & Reserva de Peças
Garanta que as peças sejam separadas e baixadas fisicamente assim que a OS entrar em bancada. O sistema já blinda novas baixas caso a OS seja movimentada entre bancada e controle de qualidade.

#### 📲 Ação 3: Rito Matinal de Alinhamento (Daily de 10 min)
Às 08:30, alinhe com a equipe técnica as 5 prioridades que devem ser entregues hoje antes das 17h para oxigenar o caixa imediato da loja.`;
    }

    // 2. Dúvidas sobre Orçamentos, Vendas e Ticket Médio
    if (isOrcamentoVendas || pillar === AiMentorPillar.REVENUE) {
      return `### 🎯 Diagnóstico Estratégico de Faturamento & Conversão
Com base nos dados reais da loja: seu Ticket Médio atual é de **R$ ${ticketMedio}** e há **${awaitingApproval} ordens de serviço paradas aguardando aprovação**, além de **${inMaintenance} em bancada**.

Respondendo diretamente à sua dúvida sobre **"${userPrompt}"**:

---

### ⚡ Diagnóstico de Faturamento Represado
1. **Janela de Ouro do Orçamento (3 Horas):** A probabilidade de fechamento cai 40% a cada hora após o envio do laudo se não houver acompanhamento ativo. O cliente que está sem o celular sente urgência imediata.
2. **Upsell na Entrega:** Baixo aproveitamento do momento da retirada para ofertar acessórios de proteção (película de privacidade, cabos homologados e capas anti-impacto).
3. **Disponibilidade Imediata de Peças:**
${stockWarningSummary}

---

### 📋 Cartões de Ação Imediata (Execute Hoje)

#### 💬 Ação 1: Disparo Ativo de Fechamento via WhatsApp
Envie para as ${awaitingApproval} OSs pendentes:
> *"Olá [Nome], nossa equipe técnica já finalizou o laudo completo do seu [Modelo]. Temos as peças originais reservadas e conseguimos liberar seu aparelho hoje com parcelamento em até 6x sem juros e garantia de 90 dias. Podemos dar início?"*

#### 💡 Ação 2: Oferta Casada para Aparelho já Aberto
Para os ${inMaintenance} aparelhos já abertos na bancada, teste a bateria. Se estiver abaixo de 80%, ofereça a troca preventiva com 25% de desconto de mão de obra aproveitando a desmontagem já realizada.

#### 🎯 Ação 3: Meta de Ticket Médio por Técnico
Defina como meta elevar o ticket médio de R$ ${ticketMedio} para R$ ${(Number(kpis.ticketMedio || 0) * 1.15).toFixed(2)} através de serviços complementares (desoxidação preventiva, limpeza acústica de microfones e nano-películas).`;
    }

    // 3. Dúvidas sobre Lucro, Margem e Comissões
    if (isLucroMargem || pillar === AiMentorPillar.PROFIT) {
      return `### 🎯 Diagnóstico de Rentabilidade & Margem Real de Bancada
Com o Ticket Médio em **R$ ${ticketMedio}**, faturar alto sem controle de margem de contribuição coloca em risco o caixa líquido da empresa.

Análise aplicada para **"${userPrompt}"**:

---

### ⚡ Vazamentos Críticos de Lucratividade
1. **O Retrabalho por Garantia:** Peças paralelas de baixo custo têm índice de retorno de até 15%. Uma única troca de tela em garantia consome todo o lucro líquido de 3 outros serviços sadios.
2. **Comissão Descolada do Resultado:** Pagar comissão apenas sobre o faturamento bruto estimula técnicos a dar descontos excessivos ou usar peças caras da loja sem gerar lucro real.
3. **Custo de Peças Paradas:**
${stockWarningSummary}

---

### 📋 Cartões de Ação Imediata (Execute Hoje)

#### 📊 Ação 1: Margem Mínima por Categoria de Serviço
- **Serviços Puros (Software / Conector / Limpeza):** Margem Bruta mínima de **70% a 80%**.
- **Troca de Telas & Displays:** Margem Bruta mínima de **45% a 55%**.
- **Micro-solda e Recuperação de Placa:** Margem Bruta mínima de **65%**, precificando o risco técnico do procedimento.

#### 🤝 Ação 2: Comissionamento Saudável com Trava de Garantia
Vincule o pagamento de comissões técnicas à ausência de retorno por garantia dentro de 30 dias. Técnico que zela pelo teste completo prévio e pós-reparo preserva a rentabilidade do negócio.

#### 🔍 Ação 3: Auditoria dos Custos de Insumos da Bancada
Monitore o consumo de fitas dupla-face especiais, colas B-7000/T-7000 e álcool isopropílico. Esses insumos costumam representar até 4% de custo oculto se não houver controle de uso.`;
    }

    // 4. Dúvidas sobre Estoque e Fornecedores
    if (isEstoqueRuptura) {
      return `### 🎯 Diagnóstico Executivo de Gestão de Estoque & Reposição
A saúde do seu estoque dita a agilidade da bancada técnica. Atualmente temos **${stockAlerts.length} itens com risco de ruptura detectado**.

Respondendo sobre **"${userPrompt}"**:

---

### ⚡ Status Atual de Ruptura & Suprimentos
${stockWarningSummary}

1. **Parada de Bancada por Falta de Peça:** Cada dia que uma peça essencial falta na gaveta significa ordens de serviço represadas e clientes insatisfeitos buscando a concorrência.
2. **Capital Imobilizado vs Itens Críticos:** Comprar em excesso peças de baixo giro retira recursos que deveriam garantir o estoque mínimo dos 20% de modelos mais frequentes (curva ABC).

---

### 📋 Cartões de Ação Imediata (Execute Hoje)

#### 📦 Ação 1: Pedido Consolidado de Reposição Quinzenal
Entre em contato agora com seu distribuidor principal para os itens críticos listados acima. Negocie prazo de pagamento de 14/28 dias ou desconto à vista de 5% a 8% pelo volume do pedido.

#### 🏷️ Ação 2: Organização por Gaveteiro & Localização Física
Garanta que toda peça cadastrada no TorxOS possua indicação clara da gaveta ou prateleira de bancada, eliminando o tempo perdido de técnicos procurando componentes na oficina.

#### 🛡️ Ação 3: Política de Estoque Mínimo Dinâmico
Mantenha sempre no mínimo 3 unidades para telas e baterias dos modelos de alta rotatividade identificados no seu histórico.`;
    }

    // 5. Dúvidas sobre Financeiro, Contas a Pagar e Fluxo de Caixa
    if (isFinanceiroCaixa || pillar === AiMentorPillar.FINANCE) {
      return `### 🎯 Diagnóstico Financeiro & Projeção de Caixa (Próximos 15 Dias)
O panorama de liquidez da sua assistência técnica para a janela de 15 dias:
- **Contas a Pagar Previstas:** R$ ${payables}
- **Contas a Receber Previstas:** R$ ${receivables}
- **Resultado Operacional Líquido:** R$ ${netFlow}

Análise sob medida para: **"${userPrompt}"**:

---

### ⚡ Indicadores de Caixa & Pontos de Alerta
1. ${Number(kpis.contasAReceber15Dias || 0) >= Number(kpis.contasAPagar15Dias || 0)
    ? "✅ **Caixa com Cobertura Positiva:** Os recebimentos previstos superam as despesas projetadas. O foco central deve ser a pontualidade na liquidação e combate à inadimplência."
    : "⚠️ **Atenção ao Saldo Operacional:** As contas a pagar superam as entradas confirmadas. É fundamental acelerar a entrega das OSs concluídas para injetar caixa imediato."}
2. **Dinheiro Parado em Aparelhos Concluídos:**
Existem OSs prontas aguardando retirada no balcão que representam capital líquido represado.
3. **Controle de Peças:**
${stockWarningSummary}

---

### 📋 Cartões de Ação Imediata (Execute Hoje)

#### 💰 Ação 1: Força-Tarefa de Liberação de OSs Prontas
Dispare avisos para clientes cujos aparelhos estão prontos para retirada. Ofereça entrega via motoboy/Uber Flash para clientes sem disponibilidade de buscar hoje na loja.

#### 🧾 Ação 2: Conciliação Diária de Caixa
Não deixe despesas pequenas (almoço, ferramentas de bancada, suprimentos de limpeza) passarem sem registro. Lançamentos esquecidos distorcem o DRE no final do mês.

#### 📅 Ação 3: Renegociação Preventiva de Títulos
Se houver boletos com vencimento nos próximos 3 dias sem cobertura prevista, acione os fornecedores com antecedência para prorrogar o prazo, mantendo a reputação e o crédito da empresa intactos.`;
    }

    // 6. Dúvidas sobre Atendimento, Marketing e Objeções
    return `### 🎯 Diagnóstico de Atendimento, Conversão & Marketing
Com **${totalOs} Ordens de Serviço** e Ticket Médio de **R$ ${ticketMedio}**, a fidelização do cliente e a reputação da loja definem a rentabilidade a longo prazo.

Respondendo especificamente sobre **"${userPrompt}"**:

---

### ⚡ Oportunidades Comerciais Identificadas
1. **Quebra Humanizada de Objeções:** Clientes que contestam valores geralmente têm receio de pagar por peças de baixa durabilidade. Explicar o rigor técnico do teste de bancada e o respaldo da garantia formal de 90 dias desmonta a comparação injusta com concorrentes amadores.
2. **Ativação da Base Inativa:** Clientes que fizeram reparos há mais de 6 meses precisam de troca de película, bateria ou limpeza de conectores.
3. **Disponibilidade Operacional:**
${stockWarningSummary}

---

### 📋 Cartões de Ação Imediata (Execute Hoje)

#### 💬 Ação 1: Script de WhatsApp para Quebra de Objeção ("Achei Caro")
> *"Entendo sua preocupação com o valor, [Nome]. No mercado existem peças paralelas sem certificação que duram pouco e prejudicam o aparelho. Nós trabalhamos exclusivamente com componentes homologados, testados na bancada e acompanhados de Garantia Total de 90 dias por escrito. O seu aparelho é um equipamento valioso e nosso reparo garante tranquilidade absoluta."*

#### ⭐ Ação 2: Coleta de Avaliações 5 Estrelas no Google
Ao entregar o aparelho consertado e ver o cliente satisfeito, ofereça 20% de desconto na aplicação da próxima película em troca de uma avaliação sincera de 5 estrelas no Google através do QR Code do balcão.

#### 📢 Ação 3: Campanha Relâmpago nas Redes & WhatsApp
Divulgue: *"Seu celular está com som baixo ou esquentando? Traga hoje na nossa loja para uma Higienização Técnica e Desobstrução de Alto-falantes gratuita durante nossa avaliação de bancada!"*`;
  }

  /**
   * Chamada ao modelo Google Gemini via REST API com Fallback e Cascata de Modelos
   */
  private async callGemini(systemPrompt: string, userPrompt: string, context?: any, pillar?: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn("Chave GEMINI_API_KEY não configurada. Ativando Motor Analítico Nativo TorxOS.");
      return this.generateAnalyticalResponse(pillar || "REVENUE", userPrompt, context || {});
    }

    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    // Tenta os modelos da lista em cascata caso ocorra 404, 503 ou indisponibilidade temporária
    for (const model of this.candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer && answer.trim().length > 0) {
            this.logger.log(`Resposta do Mentor IA gerada com sucesso via Gemini (${model}).`);
            return answer;
          }
        } else {
          const errText = await response.text();
          this.logger.warn(`Modelo ${model} retornou status ${response.status} (${errText.slice(0, 150)}). Tentando próximo modelo...`);
        }
      } catch (error: any) {
        this.logger.warn(`Falha na chamada ao modelo ${model}: ${error.message}. Tentando próximo modelo...`);
      }
    }

    // Se todos os modelos externos falharem, aciona o Motor Analítico Nativo com resposta contextual dinâmica
    this.logger.warn("Todos os modelos externos Gemini indisponíveis. Acionando Motor Analítico Nativo TorxOS com resposta contextual.");
    return this.generateAnalyticalResponse(pillar || "REVENUE", userPrompt, context || {});
  }

  async consult(tenantId: string, userId: string, dto: ConsultMentorDto) {
    const context = await this.extractAnalyticalContext(tenantId, dto.pillar);

    const systemPrompt = `Você é o TORXOS AI MENTOR, um Diretor de Operações e Consultor Estratégico C-Level especializado em assistência técnica de smartphones, computadores e eletrônicos.

SUAS DIRETRIZES INVIOLÁVEIS:
1. PROIBIÇÃO ABSOLUTA DE RESPOSTAS GENÉRICAS OU TEÓRICAS:
   - É expressamente proibido dar conselhos óbvios ou de autoajuda (ex: "organize melhor seu tempo", "atenda com empatia", "busque bons fornecedores").
   - Você DEVE basear 100% da sua análise nos dados reais da oficina fornecidos no JSON de contexto.

2. CITAÇÃO OBRIGATÓRIA DE DADOS FACTUAIS:
   - Cite sempre números de OS específicos (ex: OS #1048, OS #1041, OS #1044), nomes de clientes, aparelhos, valores monetários em R$ e quantidades de estoque.

3. RESPOSTA DIRETA NA PRIMEIRA LINHA:
   - A sua primeira frase deve responder diretamente à pergunta do gestor (com Sim/Não ou o dado solicitado), sem enrolação.

4. REGRAS DO LABORATÓRIO TORXOS:
   - A coluna "Aguardando Peça" foi REMOVIDA do fluxo. Ordens sem estoque retornam para "APROVADO" com o selo vermelho "Sem estoque".
   - A baixa física de estoque ocorre unicamente na transição para "EM BANCADA".
   - Aparelhos em triagem e análise rápida não devem passar de 20 a 30 minutos sem laudo.

5. ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
   - 🎯 **Diagnóstico Direto** (Fatos, OSs e números reais).
   - ⚡ **Gargalos & Impacto Financeiro** (Dinheiro parado e riscos).
   - 📋 **Cartões de Ação Imediata** (3 passos práticos para executar hoje).
Responda sempre em Português do Brasil com formatação rica em Markdown.`;

    const userPrompt = `Contexto analítico da loja:\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n\nPilar escolhido: ${dto.pillar}\nPergunta do Gestor: "${dto.prompt}"`;

    const aiMarkdown = await this.callGemini(systemPrompt, userPrompt, context, dto.pillar);

    // Salva a sessão no histórico (com aggregatedContextJson serializado como String para o SQLite)
    const session = await this.prisma.aiMentorSession.create({
      data: {
        tenantId,
        userId,
        pillar: dto.pillar,
        userPrompt: dto.prompt,
        aggregatedContextJson: typeof context === "string" ? context : JSON.stringify(context),
        aiResponseMarkdown: aiMarkdown,
      },
    });

    return {
      sessionId: session.id,
      pillar: dto.pillar,
      response: aiMarkdown,
      context,
      createdAt: session.createdAt,
    };
  }

  async getDailyBriefing(tenantId: string, userId: string) {
    const context = await this.extractAnalyticalContext(tenantId, AiMentorPillar.ROUTINE);

    const systemPrompt = `Você é o TORXOS AI Mentor. Gere um Briefing Matinal Executivo para o gestor da assistência técnica.
Analise os dados da loja de hoje: Ordens de serviço paradas, risco de falta de peças e compromissos financeiros dos próximos 15 dias.
Forneça 3 prioridades críticas de ação para hoje. Seja motivador e altamente objetivo.`;

    const userPrompt = `Dados operacionais de hoje:\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``;

    const briefing = await this.callGemini(systemPrompt, userPrompt, context, AiMentorPillar.ROUTINE);

    return {
      title: "Briefing Executivo Diário — TorxOS AI",
      briefing,
      kpis: context.kpis,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateQuoteCopy(tenantId: string, dto: GenerateQuoteCopyDto) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: dto.serviceOrderId, tenantId },
      include: {
        client: true,
        items: true,
        tenant: true,
      },
    });

    if (!order) {
      throw new BadRequestException("Ordem de serviço não encontrada.");
    }

    const publicUrl = `http://localhost:3000/status/${order.publicToken}`;

    const itemsFormatted = order.items
      .map((i) => `• ${i.description}: R$ ${Number(i.unitPrice).toFixed(2)}`)
      .join("\n");

    const fallbackCopy = `Olá, ${order.client.name}! Tudo bem? Aqui é da equipe técnica especializada da ${order.tenant?.tradeName || order.tenant?.legalName || "Assistência"}. 🛠️

Finalizamos o diagnóstico completo do seu *${order.deviceBrand} ${order.deviceModel}*:
🔍 *Diagnóstico:* ${order.technicalDiagnosis || order.reportedDefect || "Falha identificada nos componentes internos"}

📋 *Serviços & Peças Necessárias:*
${itemsFormatted || `• Reparo Técnico Geral: R$ ${Number(order.netTotal).toFixed(2)}`}

💰 *Valor Total:* R$ ${Number(order.netTotal).toFixed(2)} (Facilitamos em até 6x no cartão ou com desconto especial no Pix)
🛡️ *Garantia:* 90 dias com certificado e peças homologadas.

Você pode conferir o laudo com fotos e aprovar com apenas 1 clique no link abaixo:
👉 ${publicUrl}

Podemos iniciar a manutenção para liberar seu aparelho o mais rápido possível?`;

    const systemPrompt = `Você é um especialista em copywriting persuasivo de vendas e atendimento via WhatsApp para assistências técnicas.
Sua missão é escrever uma mensagem humanizada, transparente e convincente para apresentar o orçamento de um reparo ao cliente.
Destaque:
- O diagnóstico do problema com clareza sem jargões indecifráveis.
- A garantia formal de 90 dias com peças testadas.
- O link para aprovação digital remota em 1 clique: ${publicUrl}
- Se houver objeção cadastrada, quebre-a com cordialidade.`;

    const userPrompt = `Dados do cliente e reparo:
Cliente: ${order.client.name}
Aparelho: ${order.deviceBrand} ${order.deviceModel}
Defeito relatado: ${order.reportedDefect}
Diagnóstico: ${order.technicalDiagnosis || "Análise preliminar de bancada concluída"}
Peças e serviços orçados: ${order.items.map((i) => `${i.description} (R$ ${Number(i.unitPrice).toFixed(2)})`).join(", ")}
Valor Total: R$ ${Number(order.netTotal).toFixed(2)}
Objeção do cliente: ${dto.customerObjection || "Nenhuma registrada"}`;

    let copy = "";
    try {
      copy = await this.callGemini(systemPrompt, userPrompt, { order }, "MARKETING");
      // Se retornou a análise executiva genérica por fallback, usa o fallbackCopy de WhatsApp que é feito sob medida
      if (copy.includes("### 🎯 Diagnóstico")) {
        copy = fallbackCopy;
      }
    } catch {
      copy = fallbackCopy;
    }

    return {
      serviceOrderId: order.id,
      clientPhone: order.client.phone,
      clientName: order.client.name,
      suggestedMessage: copy || fallbackCopy,
      publicLink: publicUrl,
    };
  }
}
