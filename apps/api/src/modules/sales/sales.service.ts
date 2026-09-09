import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { TransactionType, TransactionStatus } from "../../common/enums";

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Registra uma nova venda de balcão (Acessórios, Celulares ou Eletrônicos)
   * Executa baixa física atômica no estoque e gera receita liquidada no caixa.
   */
  async create(tenantId: string, dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("A venda deve conter ao menos um produto.");
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Gera numeração sequencial de venda para o tenant
      const lastSale = await tx.sale.findFirst({
        where: { tenantId },
        orderBy: { saleNumber: "desc" },
        select: { saleNumber: true },
      });
      const saleNumber = (lastSale?.saleNumber || 1000) + 1;

      // 2. Processa cada item, obtém custo para CMV e calcula totais
      let grossTotal = 0;
      let totalItemDiscount = 0;

      const itemsToCreate = [];
      const productsToUpdate = [];

      for (const itemDto of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: itemDto.productId, tenantId },
        });

        if (!product) {
          throw new NotFoundException(`Produto com ID ${itemDto.productId} não encontrado.`);
        }

        const quantity = Number(itemDto.quantity) || 1;
        const unitPrice = Number(itemDto.unitPrice) || Number(product.salePrice);
        const unitCost = Number(product.costPrice) || 0;
        const discountAmount = Number(itemDto.discountAmount) || 0;
        const totalAmount = quantity * unitPrice - discountAmount;

        grossTotal += quantity * unitPrice;
        totalItemDiscount += discountAmount;

        itemsToCreate.push({
          tenantId,
          productId: product.id,
          imeiOrSerial: itemDto.imeiOrSerial?.trim() || null,
          quantity,
          unitCost,
          unitPrice,
          discountAmount,
          totalAmount,
        });

        productsToUpdate.push({
          product,
          quantity,
        });
      }

      const globalDiscount = Number(dto.discountAmount) || 0;
      const totalDiscount = totalItemDiscount + globalDiscount;
      const netTotal = Math.max(0, grossTotal - totalDiscount);

      const receivedAmount = dto.receivedAmount ? Number(dto.receivedAmount) : netTotal;
      const changeAmount = receivedAmount > netTotal ? receivedAmount - netTotal : 0;

      // 3. Cria a Venda e seus Itens
      const sale = await tx.sale.create({
        data: {
          tenantId,
          saleNumber,
          clientId: dto.clientId || null,
          sellerId: dto.sellerId || null,
          totalAmount: grossTotal,
          discountAmount: totalDiscount,
          netTotal,
          paymentMethod: dto.paymentMethod,
          receivedAmount,
          changeAmount,
          status: "COMPLETED",
          notes: dto.notes || null,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: { include: { product: true } },
          client: true,
          seller: true,
        },
      });

      // 4. Baixa física imediata no estoque para cada produto
      for (const p of productsToUpdate) {
        const updatedProduct = await tx.product.update({
          where: { id: p.product.id },
          data: {
            currentStock: {
              decrement: p.quantity,
            },
          },
        });

        // Atualização preditiva de risco de ruptura
        const newStock = Number(updatedProduct.currentStock);
        const reorder = Number(updatedProduct.reorderPointCalculated);
        const safety = Number(updatedProduct.safetyStockCalculated);

        let risk = "HEALTHY";
        if (newStock <= safety) {
          risk = "CRITICAL";
        } else if (newStock <= reorder) {
          risk = "WARNING";
        }

        if (risk !== updatedProduct.stockoutRiskStatus) {
          await tx.product.update({
            where: { id: p.product.id },
            data: { stockoutRiskStatus: risk },
          });
        }

        this.logger.log(`[PDV BAIXA ESTOQUE] Venda #${saleNumber}: Produto ${p.product.name}, Baixa de ${p.quantity} un. Saldo restante: ${newStock}`);
      }

      // 5. Integração Financeira: Cria Receita Liquidada (SETTLED) no Caixa
      let chartAccount = await tx.chartOfAccount.findFirst({
        where: { tenantId, code: "3.1.02" },
      });

      if (!chartAccount) {
        chartAccount = await tx.chartOfAccount.create({
          data: {
            tenantId,
            code: "3.1.02",
            name: "Receita com Venda de Acessórios, Celulares & Eletrônicos",
            accountType: "REVENUE",
          },
        });
      }

      const today = new Date();
      await tx.financialTransaction.create({
        data: {
          tenantId,
          transactionType: TransactionType.RECEIVABLE,
          chartOfAccountId: chartAccount.id,
          clientId: dto.clientId || null,
          saleId: sale.id,
          description: `Venda de Balcão #${saleNumber} (${sale.items.length} itens)`,
          grossAmount: netTotal,
          netAmount: netTotal,
          competenceDate: today,
          dueDate: today,
          settlementDate: today,
          status: TransactionStatus.SETTLED,
          paymentMethod: dto.paymentMethod,
        },
      });

      // 6. Se houver vendedor associado, calcula comissão sobre produtos e provisiona no Contas a Pagar
      if (dto.sellerId) {
        const seller = await tx.user.findUnique({ where: { id: dto.sellerId } });
        if (seller && Number(seller.commissionProductsPercent) > 0) {
          const commissionAmount = netTotal * (Number(seller.commissionProductsPercent) / 100);
          if (commissionAmount > 0) {
            let commChart = await tx.chartOfAccount.findFirst({
              where: { tenantId, code: "4.1.03" },
            });
            if (!commChart) {
              commChart = await tx.chartOfAccount.create({
                data: {
                  tenantId,
                  code: "4.1.03",
                  name: "Comissões sobre Vendas de Balcão",
                  accountType: "COST",
                },
              });
            }

            await tx.financialTransaction.create({
              data: {
                tenantId,
                transactionType: TransactionType.PAYABLE,
                chartOfAccountId: commChart.id,
                saleId: sale.id,
                description: `Comissão Vendedor ${seller.name} - Venda #${saleNumber}`,
                grossAmount: commissionAmount,
                netAmount: commissionAmount,
                competenceDate: today,
                dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 5),
                status: TransactionStatus.PENDING,
                paymentMethod: "PIX",
              },
            });
          }
        }
      }

      this.logger.log(`[PDV SUCESSO] Venda #${saleNumber} finalizada com valor líquido de R$ ${netTotal.toFixed(2)}`);
      return sale;
    });
  }

  /**
   * Lista o histórico de vendas de balcão
   */
  async list(tenantId: string, search?: string, startDate?: string, endDate?: string, paymentMethod?: string) {
    const where: any = { tenantId };

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { client: { name: { contains: search } } },
        { notes: { contains: search } },
        { items: { some: { product: { name: { contains: search } } } } },
        { items: { some: { imeiOrSerial: { contains: search } } } },
      ];
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        client: true,
        seller: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Obtém os dados completos de uma venda (para reimpressão de comprovante térmico)
   */
  async findById(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        seller: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        financialTransactions: true,
        tenant: true,
      },
    });

    if (!sale) {
      throw new NotFoundException("Venda não encontrada.");
    }

    return sale;
  }

  /**
   * Cancela uma venda com estorno automático de estoque e financeiro
   */
  async cancel(tenantId: string, id: string) {
    const sale = await this.findById(tenantId, id);

    if (sale.status === "CANCELED") {
      throw new BadRequestException("Esta venda já está cancelada.");
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Estorna cada item vendido de volta ao estoque
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: Number(item.quantity),
            },
          },
        });
        this.logger.log(`[ESTORNO PDV] Venda #${sale.saleNumber}: Devolvido ${item.quantity} un ao produto ${item.product?.name}`);
      }

      // 2. Estorna transações financeiras geradas pela venda
      await tx.financialTransaction.updateMany({
        where: { saleId: sale.id, tenantId },
        data: { status: TransactionStatus.CANCELLED },
      });

      // 3. Marca a venda como cancelada
      return tx.sale.update({
        where: { id: sale.id },
        data: { status: "CANCELED" },
        include: { items: true },
      });
    });
  }

  /**
   * Resumo diário de vendas de balcão (KPIs de caixa do dia)
   */
  async getDailySummary(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const salesToday = await this.prisma.sale.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        createdAt: { gte: today, lte: endOfToday },
      },
      include: { items: true },
    });

    let totalRevenue = 0;
    let totalItemsSold = 0;
    const byPaymentMethod: Record<string, number> = {
      PIX: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      CASH: 0,
      MULTIPLE: 0,
    };

    for (const s of salesToday) {
      const net = Number(s.netTotal);
      totalRevenue += net;
      byPaymentMethod[s.paymentMethod] = (byPaymentMethod[s.paymentMethod] || 0) + net;
      for (const item of s.items) {
        totalItemsSold += Number(item.quantity);
      }
    }

    const totalSalesCount = salesToday.length;
    const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    return {
      date: today.toISOString().split("T")[0],
      totalSalesCount,
      totalRevenue,
      totalItemsSold,
      avgTicket,
      byPaymentMethod,
    };
  }
}
