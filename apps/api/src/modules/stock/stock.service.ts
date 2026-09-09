import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface StockPredictionResult {
  productId: string;
  name: string;
  sku: string | null;
  currentStock: number;
  dailyAvgConsumption: number;
  safetyStockCalculated: number;
  reorderPointCalculated: number;
  daysUntilStockout: number;
  stockoutRiskStatus: "CRITICAL" | "WARNING" | "HEALTHY";
  supplierLeadTimeDays: number;
  suggestedPurchaseQuantity?: number;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private prisma: PrismaService) {}

  async listProducts(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createProduct(tenantId: string, data: any) {
    const costPrice = Number(data.costPrice || 0);
    const salePrice = Number(data.salePrice || 0);
    const currentStock = Number(data.currentStock || 0);
    const leadTime = Number(data.supplierLeadTimeDays || 3);

    return this.prisma.product.create({
      data: {
        tenantId,
        name: data.name,
        sku: data.sku || null,
        barcode: data.barcode || null,
        category: data.category || "Geral",
        brand: data.brand || null,
        imageUrl: data.imageUrl || null,
        costPrice,
        salePrice,
        currentStock,
        shelfLocation: data.shelfLocation || null,
        supplierLeadTimeDays: leadTime,
      },
    });
  }

  async updateProduct(tenantId: string, id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku || null;
    if (data.barcode !== undefined) updateData.barcode = data.barcode || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.brand !== undefined) updateData.brand = data.brand || null;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.costPrice !== undefined) updateData.costPrice = Number(data.costPrice || 0);
    if (data.salePrice !== undefined) updateData.salePrice = Number(data.salePrice || 0);
    if (data.currentStock !== undefined) updateData.currentStock = Number(data.currentStock || 0);
    if (data.shelfLocation !== undefined) updateData.shelfLocation = data.shelfLocation || null;
    if (data.supplierLeadTimeDays !== undefined) updateData.supplierLeadTimeDays = Number(data.supplierLeadTimeDays || 3);

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteProduct(tenantId: string, id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStockoutPredictions(tenantId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        stockoutRiskStatus: { in: ["CRITICAL", "WARNING"] },
      },
      orderBy: [{ stockoutRiskStatus: "asc" }, { daysUntilStockout: "asc" }],
    });
  }

  /**
   * Executa o Motor Preditivo de Ruptura (InventoryForecastingService)
   * CMD = (Consumo 30d em OS) / 30
   * ES = ceil(CMD * LeadTime * 0.30)
   * ROP = ceil((CMD * LeadTime) + ES)
   * Runway = floor(Estoque / CMD)
   */
  async runInventoryForecasting(tenantId: string): Promise<StockPredictionResult[]> {
    this.logger.log(`Iniciando cálculo preditivo de estoque para o Tenant: ${tenantId}`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true },
    });

    const results: StockPredictionResult[] = [];

    for (const product of products) {
      // Busca consumo dos últimos 30 dias em ordens de serviço
      const consumptionAgg = await this.prisma.serviceOrderItem.aggregate({
        _sum: { quantity: true },
        where: {
          tenantId,
          productId: product.id,
          serviceOrder: {
            createdAt: { gte: thirtyDaysAgo },
            status: { in: ["IN_MAINTENANCE", "QUALITY_CHECK", "READY_FOR_PICKUP", "DELIVERED"] },
          },
        },
      });

      const totalConsumed30d = Number(consumptionAgg._sum.quantity || 0);
      const cmd = Number((totalConsumed30d / 30).toFixed(4));
      const leadTime = product.supplierLeadTimeDays || 3;
      const currentStock = Number(product.currentStock);

      // Fórmulas Oficiais do Blueprint 1.0.0
      const safetyStock = Math.ceil(cmd * leadTime * 0.3);
      const reorderPoint = Math.ceil(cmd * leadTime + safetyStock);

      let daysUntilStockout = 999;
      if (cmd > 0) {
        daysUntilStockout = Math.floor(currentStock / cmd);
      }

      let riskStatus: "CRITICAL" | "WARNING" | "HEALTHY" = "HEALTHY";
      if (daysUntilStockout <= leadTime) {
        riskStatus = "CRITICAL";
      } else if (currentStock <= reorderPoint) {
        riskStatus = "WARNING";
      } else {
        riskStatus = "HEALTHY";
      }

      // Sugestão de reposição (para cobrir 30 dias de demanda futura + ES)
      let suggestedPurchaseQty = 0;
      if (riskStatus === "CRITICAL" || riskStatus === "WARNING") {
        const targetStock = Math.ceil(cmd * 30 + safetyStock);
        suggestedPurchaseQty = Math.max(0, targetStock - currentStock);
        if (suggestedPurchaseQty === 0 && currentStock <= 0) {
          suggestedPurchaseQty = Math.max(5, safetyStock * 2);
        }
      }

      // Atualiza banco com os parâmetros calculados
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          dailyAvgConsumption: cmd,
          safetyStockCalculated: safetyStock,
          reorderPointCalculated: reorderPoint,
          daysUntilStockout: daysUntilStockout,
          stockoutRiskStatus: riskStatus,
        },
      });

      results.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        currentStock,
        dailyAvgConsumption: cmd,
        safetyStockCalculated: safetyStock,
        reorderPointCalculated: reorderPoint,
        daysUntilStockout,
        stockoutRiskStatus: riskStatus,
        supplierLeadTimeDays: leadTime,
        suggestedPurchaseQuantity: suggestedPurchaseQty,
      });
    }

    return results;
  }

  async autoGeneratePurchaseOrder(tenantId: string) {
    const predictions = await this.runInventoryForecasting(tenantId);
    const criticalItems = predictions.filter(
      (p) => p.stockoutRiskStatus === "CRITICAL" || p.stockoutRiskStatus === "WARNING"
    );

    const products = await this.prisma.product.findMany({
      where: { tenantId, id: { in: criticalItems.map((c) => c.productId) } },
    });

    let totalEstimatedCost = 0;
    const enrichedItems = criticalItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = Number(prod?.costPrice || 0);
      const qty = item.suggestedPurchaseQuantity || 10;
      const subtotal = unitCost * qty;
      totalEstimatedCost += subtotal;

      return {
        productId: item.productId,
        productName: item.name,
        sku: item.sku,
        brand: prod?.brand || "Generico",
        category: prod?.category || "Geral",
        currentStock: item.currentStock,
        safetyStock: item.safetyStockCalculated,
        reorderPoint: item.reorderPointCalculated,
        daysUntilStockout: item.daysUntilStockout,
        leadTimeDays: item.supplierLeadTimeDays,
        unitCost,
        suggestedQuantity: qty,
        subtotalEstimated: subtotal,
        risk: item.stockoutRiskStatus,
        urgency: item.stockoutRiskStatus === "CRITICAL" ? "IMEDIATA" : "NORMAL",
      };
    });

    return {
      orderCode: `PED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      generatedAt: new Date().toISOString(),
      tenantId,
      totalItemsToReorder: enrichedItems.length,
      totalEstimatedCost,
      items: enrichedItems,
    };
  }

  async receivePurchaseOrder(
    tenantId: string,
    data: {
      orderCode?: string;
      supplierName?: string;
      paymentTermsDays?: number;
      items: { productId: string; quantity: number; unitCost?: number }[];
    }
  ) {
    let totalPayableAmount = 0;
    const updatedProducts: any[] = [];

    for (const item of data.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.tenantId !== tenantId) continue;

      const newStock = Number(product.currentStock) + Number(item.quantity);
      const unitCost = item.unitCost !== undefined ? Number(item.unitCost) : Number(product.costPrice);
      totalPayableAmount += unitCost * Number(item.quantity);

      // Avalia novo status de risco após reposição
      const reorderPoint = Number(product.reorderPointCalculated);
      const newRisk = newStock <= Number(product.safetyStockCalculated)
        ? "CRITICAL"
        : newStock <= reorderPoint
        ? "WARNING"
        : "HEALTHY";

      const updated = await this.prisma.product.update({
        where: { id: product.id },
        data: {
          currentStock: newStock,
          costPrice: unitCost,
          stockoutRiskStatus: newRisk,
        },
      });

      updatedProducts.push(updated);
    }

    // Lança o título a pagar no contas a pagar se houver valor
    if (totalPayableAmount > 0) {
      let costChartAccount = await this.prisma.chartOfAccount.findFirst({
        where: { tenantId, code: "4.1.01" },
      });

      if (!costChartAccount) {
        costChartAccount = await this.prisma.chartOfAccount.findFirst({
          where: { tenantId },
        });
      }

      if (costChartAccount) {
        const today = new Date();
        const dueDays = data.paymentTermsDays || 28;
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + dueDays);

        await this.prisma.financialTransaction.create({
          data: {
            tenantId,
            transactionType: "PAYABLE",
            chartOfAccountId: costChartAccount.id,
            description: `Reposição de Peças - Fornecedor ${data.supplierName || "Distribuidor"} (${data.orderCode || "Estoque"})`,
            documentNumber: data.orderCode || `NF-${Date.now()}`,
            grossAmount: totalPayableAmount,
            netAmount: totalPayableAmount,
            competenceDate: today,
            dueDate: dueDate,
            status: "PENDING",
            paymentMethod: "BOLETO",
          },
        });
      }
    }

    return {
      success: true,
      message: `${updatedProducts.length} itens recebidos e atualizados no estoque com sucesso.`,
      totalPayableAmount,
      updatedCount: updatedProducts.length,
    };
  }
}
