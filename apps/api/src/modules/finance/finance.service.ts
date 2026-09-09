import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTransactionDto, SettleTransactionDto } from "./dto/finance.dto";
import { TransactionType, TransactionStatus } from "../../common/enums";

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async listTransactions(
    tenantId: string,
    type?: TransactionType,
    status?: TransactionStatus,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId };
    if (type) where.transactionType = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    return this.prisma.financialTransaction.findMany({
      where,
      include: {
        chartOfAccount: true,
        bankAccount: true,
        client: { select: { id: true, name: true } },
        serviceOrder: { select: { id: true, osNumber: true, deviceModel: true } },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  async createTransaction(tenantId: string, dto: CreateTransactionDto) {
    const gross = Number(dto.grossAmount);
    const discount = Number(dto.discountAmount || 0);
    const fee = Number(dto.feeAmount || 0);
    const net = gross - discount - fee;

    // Resolução robusta de ChartOfAccount
    let targetChartId = dto.chartOfAccountId;
    if (targetChartId && targetChartId !== "default-id") {
      const exists = await this.prisma.chartOfAccount.findFirst({
        where: { id: targetChartId, tenantId },
      });
      if (!exists) targetChartId = undefined;
    } else {
      targetChartId = undefined;
    }

    if (!targetChartId) {
      const isRec = dto.transactionType === TransactionType.RECEIVABLE;
      let defaultAccount = await this.prisma.chartOfAccount.findFirst({
        where: {
          tenantId,
          accountType: isRec ? "REVENUE" : { in: ["COST", "EXPENSE"] },
        },
      });

      if (!defaultAccount) {
        defaultAccount = await this.prisma.chartOfAccount.create({
          data: {
            tenantId,
            code: isRec ? "3.1.01" : "4.1.01",
            name: isRec ? "Receitas Gerais de Serviços e Balcão" : "Custos e Despesas Operacionais",
            accountType: isRec ? "REVENUE" : "COST",
          },
        });
      }
      targetChartId = defaultAccount.id;
    }

    return this.prisma.financialTransaction.create({
      data: {
        tenantId,
        transactionType: dto.transactionType,
        chartOfAccountId: targetChartId,
        bankAccountId: dto.bankAccountId || null,
        clientId: dto.clientId || null,
        serviceOrderId: dto.serviceOrderId || null,
        description: dto.description,
        grossAmount: gross,
        discountAmount: discount,
        feeAmount: fee,
        netAmount: net,
        competenceDate: dto.competenceDate ? new Date(dto.competenceDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(),
        status: TransactionStatus.PENDING,
        paymentMethod: dto.paymentMethod || "OUTRO",
      },
      include: {
        chartOfAccount: true,
        bankAccount: true,
      },
    });
  }

  async settleTransaction(tenantId: string, id: string, dto: SettleTransactionDto) {
    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, tenantId },
    });

    if (!transaction) {
      throw new NotFoundException("Título financeiro não encontrado.");
    }

    if (transaction.status === TransactionStatus.SETTLED) {
      throw new BadRequestException("Este título já se encontra liquidado.");
    }

    let bankAccount = null;
    if (dto.bankAccountId && dto.bankAccountId !== "dummy-id") {
      bankAccount = await this.prisma.bankAccount.findFirst({
        where: { id: dto.bankAccountId, tenantId },
      });
    }

    if (!bankAccount) {
      bankAccount = await this.prisma.bankAccount.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!bankAccount) {
      bankAccount = await this.prisma.bankAccount.create({
        data: {
          tenantId,
          name: "Caixa Balcão (Gaveta)",
          accountType: "CASH_REGISTER",
          initialBalance: 0.0,
          currentBalance: 0.0,
          isActive: true,
        },
      });
    }

    const netAmount = Number(transaction.netAmount);
    const isReceivable = transaction.transactionType === TransactionType.RECEIVABLE;

    // Atualiza saldo da conta bancária
    await this.prisma.bankAccount.update({
      where: { id: bankAccount.id },
      data: {
        currentBalance: {
          [isReceivable ? "increment" : "decrement"]: netAmount,
        },
      },
    });

    // Atualiza transação
    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        status: TransactionStatus.SETTLED,
        bankAccountId: bankAccount.id,
        settlementDate: dto.settlementDate ? new Date(dto.settlementDate) : new Date(),
        interestAmount: dto.interestAmount || transaction.interestAmount,
        discountAmount: dto.discountAmount || transaction.discountAmount,
      },
      include: { bankAccount: true, chartOfAccount: true },
    });
  }

  /**
   * Relatório DRE em Tempo Real (Regime de Competência)
   */
  async getDreReport(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    if (startDate || endDate) {
      where.competenceDate = {};
      if (startDate) where.competenceDate.gte = new Date(startDate);
      if (endDate) where.competenceDate.lte = new Date(endDate);
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where,
      include: { chartOfAccount: true },
    });

    let grossRevenue = 0;
    let deductions = 0;
    let directCosts = 0;
    let operatingExpenses = 0;

    for (const t of transactions) {
      const net = Number(t.netAmount);
      const gross = Number(t.grossAmount);
      const fee = Number(t.feeAmount || 0);

      if (t.transactionType === TransactionType.RECEIVABLE) {
        grossRevenue += gross;
        deductions += fee + Number(t.discountAmount || 0);
      } else {
        const type = t.chartOfAccount?.accountType;
        if (type === "COST") {
          directCosts += net;
        } else {
          operatingExpenses += net;
        }
      }
    }

    const netRevenue = grossRevenue - deductions;
    const grossProfit = netRevenue - directCosts;
    const netProfit = grossProfit - operatingExpenses;
    const netMarginPercent = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      period: {
        startDate: startDate || "Início",
        endDate: endDate || "Hoje",
      },
      summary: {
        grossRevenue,
        deductions,
        netRevenue,
        directCosts,
        grossProfit,
        operatingExpenses,
        netProfit,
        netMarginPercent: Number(netMarginPercent.toFixed(2)),
      },
      breakdown: transactions.map((t) => ({
        id: t.id,
        description: t.description,
        type: t.transactionType,
        account: t.chartOfAccount?.name,
        amount: Number(t.netAmount),
        competenceDate: t.competenceDate,
      })),
    };
  }

  /**
   * Projeção de Fluxo de Caixa (Realizado vs Previsto 30/60/90 dias)
   */
  async getCashFlowProjection(tenantId: string) {
    const today = new Date();
    const future90d = new Date();
    future90d.setDate(today.getDate() + 90);

    let bankAccounts = await this.prisma.bankAccount.findMany({
      where: { tenantId, isActive: true },
    });

    if (bankAccounts.length === 0) {
      const defaultAccount = await this.prisma.bankAccount.create({
        data: {
          tenantId,
          name: "Caixa Balcão (Gaveta)",
          accountType: "CASH_REGISTER",
          initialBalance: 0.0,
          currentBalance: 0.0,
          isActive: true,
        },
      });
      bankAccounts = [defaultAccount];
    }

    const currentTotalBalance = bankAccounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    );

    const pendingTransactions = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        status: { in: [TransactionStatus.PENDING, TransactionStatus.PARTIALLY_SETTLED] },
        dueDate: { lte: future90d },
      },
      orderBy: { dueDate: "asc" },
    });

    let projectedReceivables = 0;
    let projectedPayables = 0;

    for (const t of pendingTransactions) {
      if (t.transactionType === TransactionType.RECEIVABLE) {
        projectedReceivables += Number(t.netAmount);
      } else {
        projectedPayables += Number(t.netAmount);
      }
    }

    const projectedFinalBalance = currentTotalBalance + projectedReceivables - projectedPayables;

    return {
      currentTotalBalance,
      projectedReceivables,
      projectedPayables,
      projectedFinalBalance,
      accounts: bankAccounts,
      pendingCount: pendingTransactions.length,
      upcomingTransactions: pendingTransactions.slice(0, 10),
    };
  }

  // --- CONCILIAÇÃO BANCÁRIA OFX ---

  async parseAndMatchOfx(tenantId: string, ofxContent: string) {
    const content = ofxContent.replace(/\r/g, "");
    const transactionRegex = /<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
    const extractTag = (block: string, tag: string): string => {
      const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, "i");
      const m = block.match(regex);
      return m ? m[1].trim() : "";
    };

    const pendingTitles = await this.prisma.financialTransaction.findMany({
      where: {
        tenantId,
        status: { in: [TransactionStatus.PENDING, TransactionStatus.PARTIALLY_SETTLED] },
      },
      include: {
        client: { select: { name: true } },
        chartOfAccount: { select: { name: true, code: true } },
      },
    });

    const parsedItems: any[] = [];
    let match;
    let totalCredits = 0;
    let totalDebits = 0;

    while ((match = transactionRegex.exec(content)) !== null) {
      const block = match[1];
      const trnTypeRaw = extractTag(block, "TRNTYPE").toUpperCase();
      const dtPostedRaw = extractTag(block, "DTPOSTED");
      const trnAmtRaw = extractTag(block, "TRNAMT").replace(",", ".");
      const fitIdRaw = extractTag(block, "FITID") || `OFX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const memoRaw = extractTag(block, "MEMO") || extractTag(block, "NAME") || "Lançamento bancário";

      const parsedAmt = parseFloat(trnAmtRaw);
      if (isNaN(parsedAmt)) continue;

      const isCredit = trnTypeRaw === "CREDIT" || parsedAmt > 0;
      const absAmount = Math.abs(parsedAmt);

      if (isCredit) totalCredits += absAmount;
      else totalDebits += absAmount;

      // Data formatada YYYY-MM-DD
      const cleanDate = dtPostedRaw.replace(/\D/g, "");
      const formattedDate = cleanDate.length >= 8 
        ? `${cleanDate.substring(0, 4)}-${cleanDate.substring(4, 6)}-${cleanDate.substring(6, 8)}`
        : new Date().toISOString().split("T")[0];

      // Busca correspondência inteligente entre os títulos em aberto
      const targetType = isCredit ? TransactionType.RECEIVABLE : TransactionType.PAYABLE;
      
      const exactMatch = pendingTitles.find(t => 
        t.transactionType === targetType &&
        Math.abs(Number(t.netAmount) - absAmount) < 0.05
      );

      let status = "UNMATCHED";
      let suggestedMatch: any = null;

      if (exactMatch) {
        status = "MATCHED";
        suggestedMatch = {
          id: exactMatch.id,
          description: exactMatch.description,
          amount: Number(exactMatch.netAmount),
          dueDate: exactMatch.dueDate.toISOString().split("T")[0],
          clientName: exactMatch.client?.name || "Sem cliente",
          chartAccount: exactMatch.chartOfAccount?.name,
          confidencePercent: 100,
        };
      }

      parsedItems.push({
        fitId: fitIdRaw,
        type: isCredit ? "CREDIT" : "DEBIT",
        date: formattedDate,
        amount: absAmount,
        memo: memoRaw,
        reconciliationStatus: status,
        suggestedMatch,
      });
    }

    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { tenantId, isActive: true },
    });

    return {
      totalCredits: Math.round(totalCredits * 100) / 100,
      totalDebits: Math.round(totalDebits * 100) / 100,
      netBalance: Math.round((totalCredits - totalDebits) * 100) / 100,
      itemsCount: parsedItems.length,
      bankAccounts,
      items: parsedItems,
    };
  }

  async confirmReconciliation(tenantId: string, items: any[]) {
    let reconciledCount = 0;

    for (const item of items) {
      if (item.action === "IGNORE") continue;

      if (item.action === "MATCH" && item.matchedTransactionId) {
        // Quita título existente
        await this.settleTransaction(tenantId, item.matchedTransactionId, {
          bankAccountId: item.bankAccountId,
          settlementDate: item.date || new Date().toISOString().split("T")[0],
        });
        reconciledCount++;
      } else if (item.action === "CREATE_NEW") {
        // Encontra ou cria plano de contas padrão para despesa/receita bancária
        let chartId = item.chartOfAccountId;
        if (!chartId) {
          const defaultChart = await this.prisma.chartOfAccount.findFirst({
            where: { tenantId },
          });
          chartId = defaultChart?.id;
        }

        if (chartId && item.bankAccountId) {
          const isCredit = item.type === "CREDIT";
          const today = item.date ? new Date(item.date) : new Date();

          await this.prisma.financialTransaction.create({
            data: {
              tenantId,
              transactionType: isCredit ? TransactionType.RECEIVABLE : TransactionType.PAYABLE,
              chartOfAccountId: chartId,
              bankAccountId: item.bankAccountId,
              description: item.description || item.memo || "Lançamento Conciliado OFX",
              documentNumber: item.fitId,
              grossAmount: Number(item.amount),
              netAmount: Number(item.amount),
              competenceDate: today,
              dueDate: today,
              settlementDate: today,
              status: TransactionStatus.SETTLED,
              paymentMethod: "BANK_TRANSFER",
            },
          });

          // Atualiza saldo bancário
          const bank = await this.prisma.bankAccount.findUnique({
            where: { id: item.bankAccountId },
          });
          if (bank) {
            const newBal = isCredit 
              ? Number(bank.currentBalance) + Number(item.amount)
              : Number(bank.currentBalance) - Number(item.amount);

            await this.prisma.bankAccount.update({
              where: { id: item.bankAccountId },
              data: { currentBalance: newBal },
            });
          }
          reconciledCount++;
        }
      }
    }

    return {
      success: true,
      message: `${reconciledCount} lançamentos bancários conciliados com sucesso.`,
      reconciledCount,
    };
  }

  // --- GATEWAY DE COBRANÇA PIX DINÂMICO ---

  async generatePixCharge(
    tenantId: string,
    data: { amount: number; description?: string; orderNumber?: string; pixKey?: string }
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const pixKey = data.pixKey || tenant?.document || "12.345.678/0001-99";
    const cleanAmount = Number(data.amount) || 0;
    const cleanTxId = data.orderNumber ? `OS${data.orderNumber}` : `TX${Date.now().toString().slice(-6)}`;

    // Helper CRC16
    const calculateCrc16 = (payload: string): string => {
      let crc = 0xffff;
      for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) crc = ((crc << 1) ^ 0x1021) & 0xffff;
          else crc = (crc << 1) & 0xffff;
        }
      }
      return crc.toString(16).toUpperCase().padStart(4, "0");
    };

    const formatTlv = (id: string, value: string): string => {
      const len = value.length.toString().padStart(2, "0");
      return `${id}${len}${value}`;
    };

    const merchantInfo = formatTlv("00", "br.gov.bcb.pix") + formatTlv("01", pixKey.trim());
    const additionalData = formatTlv("05", cleanTxId);

    let payload =
      formatTlv("00", "01") +
      formatTlv("26", merchantInfo) +
      formatTlv("52", "0000") +
      formatTlv("53", "986") +
      formatTlv("54", cleanAmount.toFixed(2)) +
      formatTlv("58", "BR") +
      formatTlv("59", tenant?.tradeName?.substring(0, 25) || "TORXOS TECH") +
      formatTlv("60", "SAO PAULO") +
      formatTlv("62", additionalData) +
      "6304";

    const crc = calculateCrc16(payload);
    const brCode = `${payload}${crc}`;

    return {
      txId: cleanTxId,
      pixKey,
      amount: cleanAmount,
      brCode,
      merchantName: tenant?.tradeName || "TORXOS TECH",
      generatedAt: new Date().toISOString(),
    };
  }

  async simulatePixWebhook(
    tenantId: string,
    data: { txId: string; amount: number; transactionId?: string; bankAccountId?: string }
  ) {
    // Localiza a conta bancária padrão do tenant (ou Itaú)
    let bank = await this.prisma.bankAccount.findFirst({
      where: { tenantId, isActive: true },
    });

    if (data.transactionId) {
      // Quita título pendente existente
      await this.settleTransaction(tenantId, data.transactionId, {
        bankAccountId: bank?.id || "",
        settlementDate: new Date().toISOString().split("T")[0],
      });
    }

    return {
      success: true,
      status: "SETTLED",
      txId: data.txId,
      amount: data.amount,
      settledAt: new Date().toISOString(),
      message: `Notificação Open Finance PIX recebida e processada com sucesso no valor de R$ ${data.amount.toFixed(2)}.`,
    };
  }

  // --- GERENCIAMENTO DE CONTAS BANCÁRIAS E CAIXAS ---

  async listBankAccounts(tenantId: string) {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (accounts.length === 0) {
      const defaultAccount = await this.prisma.bankAccount.create({
        data: {
          tenantId,
          name: "Caixa Balcão (Gaveta)",
          accountType: "CASH_REGISTER",
          initialBalance: 0.0,
          currentBalance: 0.0,
          isActive: true,
        },
      });
      return [defaultAccount];
    }

    return accounts;
  }

  async createBankAccount(
    tenantId: string,
    data: { name: string; accountType: string; initialBalance?: number; currentBalance?: number }
  ) {
    const initial = Number(data.initialBalance || data.currentBalance || 0);
    const current = Number(data.currentBalance !== undefined ? data.currentBalance : initial);

    return this.prisma.bankAccount.create({
      data: {
        tenantId,
        name: data.name,
        accountType: data.accountType || "CHECKING_ACCOUNT",
        initialBalance: initial,
        currentBalance: current,
        isActive: true,
      },
    });
  }

  async updateBankAccount(
    tenantId: string,
    id: string,
    data: { name?: string; accountType?: string; currentBalance?: number; isActive?: boolean }
  ) {
    const exists = await this.prisma.bankAccount.findFirst({
      where: { id, tenantId },
    });

    if (!exists) {
      throw new NotFoundException("Conta bancária não encontrada.");
    }

    const type = String(exists.accountType || "").toUpperCase();
    const name = String(exists.name || "").toLowerCase();
    const isCash = type === "CASH" || type === "CASH_REGISTER" || name.includes("caixa") || name.includes("gaveta");

    if (isCash) {
      if (data.isActive === false) {
        throw new BadRequestException("O Caixa da loja é obrigatório para a operação e não pode ser inativado.");
      }
      if (data.name && !data.name.toLowerCase().includes("caixa")) {
        throw new BadRequestException("A conta de Caixa não pode ser renomeada para conta bancária.");
      }
      if (data.accountType && data.accountType !== "CASH" && data.accountType !== "CASH_REGISTER") {
        throw new BadRequestException("O tipo do Caixa não pode ser alterado.");
      }
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.accountType && { accountType: data.accountType }),
        ...(data.currentBalance !== undefined && { currentBalance: Number(data.currentBalance) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteBankAccount(tenantId: string, id: string) {
    const exists = await this.prisma.bankAccount.findFirst({
      where: { id, tenantId },
    });

    if (!exists) {
      throw new NotFoundException("Conta bancária não encontrada.");
    }

    const type = String(exists.accountType || "").toUpperCase();
    const name = String(exists.name || "").toLowerCase();
    const isCash = type === "CASH" || type === "CASH_REGISTER" || name.includes("caixa") || name.includes("gaveta");

    if (isCash) {
      throw new BadRequestException("Regra de Segurança: O Ponto de Caixa/Gaveta é obrigatório para o fluxo da loja e não pode ser excluído.");
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
