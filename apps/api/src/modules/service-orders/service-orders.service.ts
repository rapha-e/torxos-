import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateServiceOrderDto, UpdateOsStatusDto, ClientApproveDto } from "./dto/service-order.dto";
import { OsStatus, TransactionType, TransactionStatus } from "../../common/enums";

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, status?: OsStatus, search?: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { client: { name: { contains: search } } },
        { deviceModel: { contains: search } },
        { serialOrImei: { contains: search } },
      ];
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

    return this.prisma.serviceOrder.findMany({
      where,
      include: {
        client: true,
        technician: { select: { id: true, name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getKanban(tenantId: string) {
    const orders = await this.prisma.serviceOrder.findMany({
      where: { tenantId },
      include: {
        client: true,
        technician: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const columns: Record<OsStatus, typeof orders> = {
      TRIAGE: [],
      ANALYSIS: [],
      AWAITING_APPROVAL: [],
      APPROVED: [],
      IN_MAINTENANCE: [],
      AWAITING_PARTS: [],
      QUALITY_CHECK: [],
      READY_FOR_PICKUP: [],
      DELIVERED: [],
      CANCELED: [],
    };

    for (const order of orders) {
      if (order.status === OsStatus.AWAITING_PARTS || (order.status as string) === "AWAITING_PARTS") {
        columns[OsStatus.APPROVED].push({ ...order, status: OsStatus.APPROVED });
      } else if (columns[order.status]) {
        columns[order.status].push(order);
      }
    }

    return columns;
  }

  async findById(tenantId: string, id: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        tenant: true,
        client: true,
        technician: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        financialTransactions: true,
      },
    });

    if (!order) throw new NotFoundException("Ordem de Serviço não encontrada.");
    return order;
  }

  async create(tenantId: string, dto: CreateServiceOrderDto) {
    let totalServices = 0;
    let totalParts = 0;

    const itemsToCreate = (dto.items || []).map((item) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const unitCost = Number(item.unitCost) || 0;
      const discount = Number(item.discountAmount) || 0;
      const totalAmount = quantity * unitPrice - discount;

      if (item.itemType === "SERVICE") {
        totalServices += totalAmount;
      } else {
        totalParts += totalAmount;
      }

      return {
        tenantId,
        itemType: item.itemType,
        productId: item.productId || null,
        description: item.description,
        quantity,
        unitCost,
        unitPrice,
        discountAmount: discount,
        totalAmount,
        technicianId: item.technicianId || dto.technicianId || null,
      };
    });

    const netTotal = totalServices + totalParts;

    // Calcula o próximo número sequencial da OS para o Tenant
    const lastOs = await this.prisma.serviceOrder.findFirst({
      where: { tenantId },
      orderBy: { osNumber: "desc" },
      select: { osNumber: true },
    });
    const nextOsNumber = lastOs && typeof lastOs.osNumber === "number" ? lastOs.osNumber + 1 : 1001;

    return this.prisma.serviceOrder.create({
      data: {
        tenantId,
        osNumber: nextOsNumber,
        clientId: dto.clientId,
        technicianId: dto.technicianId || null,
        priority: dto.priority || "NORMAL",
        deviceType: dto.deviceType,
        deviceBrand: dto.deviceBrand,
        deviceModel: dto.deviceModel,
        serialOrImei: dto.serialOrImei || null,
        devicePassword: dto.devicePassword || null,
        reportedDefect: dto.reportedDefect,
        entryChecklist:
          typeof dto.entryChecklist === "object"
            ? JSON.stringify(dto.entryChecklist)
            : (dto.entryChecklist || "{}"),
        totalServices,
        totalParts,
        netTotal,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        tenant: true,
        client: true,
        technician: true,
        items: true,
      },
    });
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOsStatusDto) {
    const order = await this.findById(tenantId, id);

    const oldStatus = order.status;
    const newStatus = dto.status;

    // Regra 1: Baixa física no estoque ao transicionar para IN_MAINTENANCE
    // TRAVA ANTIFALHA DE BANCADA: Se a OS já teve baixa de estoque realizada (order.stockDeducted === true),
    // qualquer movimentação subsequente pela bancada NÃO efetuará baixa duplicada.
    if (newStatus === "IN_MAINTENANCE" && !order.stockDeducted) {
      await this.validateStockAvailability(tenantId, order);
      await this.deductStockForOrder(tenantId, order);
    }

    // Regra 2: Estorno automático de estoque caso a OS com baixa seja cancelada (CANCELED)
    if (newStatus === "CANCELED" && order.stockDeducted) {
      await this.restoreStockForOrder(tenantId, order);
    }

    // Regra 3: Finalização com geração financeira e comissão ao transicionar para DELIVERED
    if (newStatus === "DELIVERED" && oldStatus !== "DELIVERED") {
      await this.generateFinanceAndCommission(tenantId, order, dto.paymentMethod || "PIX");
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status: newStatus,
        technicalDiagnosis: dto.technicalDiagnosis || order.technicalDiagnosis,
        deliveredAt: newStatus === "DELIVERED" ? new Date() : order.deliveredAt,
      },
      include: { client: true, items: true, technician: true },
    });
  }

  private async validateStockAvailability(tenantId: string, order: any) {
    const items = order.items || [];
    for (const item of items) {
      if (item.itemType === "PRODUCT" && !item.stockDeducted) {
        const qtyToDecrement = Number(item.quantity) || 1;
        let product: any = null;

        if (item.productId) {
          product = await this.prisma.product.findUnique({
            where: { id: item.productId },
          });
        } else if (item.description) {
          product = await this.prisma.product.findFirst({
            where: {
              tenantId,
              name: item.description,
              isActive: true,
            },
          });
        }

        if (product) {
          const currentStock = Number(product.currentStock) || 0;
          if (currentStock < qtyToDecrement) {
            throw new BadRequestException(
              `Estoque insuficiente para a peça "${product.name}". Saldo atual: ${currentStock}, Necessário: ${qtyToDecrement}. A OS não pode entrar em bancada até a reposição.`
            );
          }
        }
      }
    }
  }

  private async deductStockForOrder(tenantId: string, order: any) {
    if (order.stockDeducted) {
      this.logger.warn(`[TRAVA BANCADA] OS #${order.osNumber} (${order.id}) já possui baixa de estoque. Operação ignorada.`);
      return;
    }

    const items = order.items || [];
    let itemsDeductedCount = 0;

    for (const item of items) {
      // Baixa apenas itens do tipo PRODUCT que ainda não foram baixados
      if (item.itemType === "PRODUCT" && !item.stockDeducted) {
        const qtyToDecrement = Number(item.quantity) || 1;

        if (item.productId) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: qtyToDecrement,
              },
            },
          });
          this.logger.log(`Baixa física no estoque por ID: Produto ${item.productId}, Qtd: ${qtyToDecrement} (OS #${order.osNumber})`);
        } else if (item.description) {
          // Busca por correspondência exata do nome da peça
          const matchedProduct = await this.prisma.product.findFirst({
            where: {
              tenantId,
              name: item.description,
              isActive: true,
            },
          });

          if (matchedProduct) {
            await this.prisma.product.update({
              where: { id: matchedProduct.id },
              data: {
                currentStock: {
                  decrement: qtyToDecrement,
                },
              },
            });
            this.logger.log(`Baixa física no estoque por Nome: Produto ${matchedProduct.name}, Qtd: ${qtyToDecrement} (OS #${order.osNumber})`);
          }
        }

        // Marca item individual como baixado
        await this.prisma.serviceOrderItem.update({
          where: { id: item.id },
          data: {
            stockDeducted: true,
            stockDeductedAt: new Date(),
          },
        });
        itemsDeductedCount++;
      }
    }

    // Registra na OS que o estoque físico de bancada foi baixado
    await this.prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        stockDeducted: true,
        stockDeductedAt: new Date(),
      },
    });

    this.logger.log(`Estoque de bancada baixado com sucesso para OS #${order.osNumber}. Itens processados: ${itemsDeductedCount}`);
  }

  private async restoreStockForOrder(tenantId: string, order: any) {
    const items = order.items || [];
    let itemsRestoredCount = 0;

    for (const item of items) {
      if (item.itemType === "PRODUCT" && item.stockDeducted) {
        const qtyToIncrement = Number(item.quantity) || 1;

        if (item.productId) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: qtyToIncrement,
              },
            },
          });
          this.logger.log(`Estorno de estoque por cancelamento (ID): Produto ${item.productId}, Qtd: ${qtyToIncrement} (OS #${order.osNumber})`);
        } else if (item.description) {
          const matchedProduct = await this.prisma.product.findFirst({
            where: {
              tenantId,
              name: item.description,
              isActive: true,
            },
          });

          if (matchedProduct) {
            await this.prisma.product.update({
              where: { id: matchedProduct.id },
              data: {
                currentStock: {
                  increment: qtyToIncrement,
                },
              },
            });
            this.logger.log(`Estorno de estoque por cancelamento (Nome): Produto ${matchedProduct.name}, Qtd: ${qtyToIncrement} (OS #${order.osNumber})`);
          }
        }

        await this.prisma.serviceOrderItem.update({
          where: { id: item.id },
          data: {
            stockDeducted: false,
            stockDeductedAt: null,
          },
        });
        itemsRestoredCount++;
      }
    }

    await this.prisma.serviceOrder.update({
      where: { id: order.id },
      data: {
        stockDeducted: false,
        stockDeductedAt: null,
      },
    });

    this.logger.log(`Estoque estornado por cancelamento da OS #${order.osNumber}. Itens devolvidos: ${itemsRestoredCount}`);
  }

  private async generateFinanceAndCommission(tenantId: string, order: any, paymentMethod: string) {
    // Busca ou cria Plano de Contas padrão para Receita de Serviços
    let chartAccount = await this.prisma.chartOfAccount.findFirst({
      where: { tenantId, code: "3.1.01" },
    });

    if (!chartAccount) {
      chartAccount = await this.prisma.chartOfAccount.create({
        data: {
          tenantId,
          code: "3.1.01",
          name: "Receita com Prestação de Serviços & Peças",
          accountType: "REVENUE",
        },
      });
    }

    // Cria título a receber
    const today = new Date();
    await this.prisma.financialTransaction.create({
      data: {
        tenantId,
        transactionType: TransactionType.RECEIVABLE,
        chartOfAccountId: chartAccount.id,
        clientId: order.clientId,
        serviceOrderId: order.id,
        description: `Recebimento OS #${order.osNumber} - ${order.deviceModel}`,
        grossAmount: order.netTotal,
        netAmount: order.netTotal,
        competenceDate: today,
        dueDate: today,
        settlementDate: today,
        status: TransactionStatus.SETTLED,
        paymentMethod: paymentMethod,
      },
    });

    // Se houver técnico associado, calcula e gera comissão no Contas a Pagar
    if (order.technicianId) {
      const technician = await this.prisma.user.findUnique({
        where: { id: order.technicianId },
      });

      if (technician) {
        const commServices = Number(order.totalServices) * (Number(technician.commissionServicesPercent) / 100);
        const commProducts = Number(order.totalParts) * (Number(technician.commissionProductsPercent) / 100);
        const totalCommission = commServices + commProducts;

        if (totalCommission > 0) {
          let commChartAccount = await this.prisma.chartOfAccount.findFirst({
            where: { tenantId, code: "4.1.02" },
          });

          if (!commChartAccount) {
            commChartAccount = await this.prisma.chartOfAccount.create({
              data: {
                tenantId,
                code: "4.1.02",
                name: "Comissões Técnicas sobre OS",
                accountType: "COST",
              },
            });
          }

          await this.prisma.financialTransaction.create({
            data: {
              tenantId,
              transactionType: TransactionType.PAYABLE,
              chartOfAccountId: commChartAccount.id,
              serviceOrderId: order.id,
              description: `Comissão Técnico ${technician.name} - OS #${order.osNumber}`,
              grossAmount: totalCommission,
              netAmount: totalCommission,
              competenceDate: today,
              dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 5), // Quinto dia útil do próximo mês
              status: TransactionStatus.PENDING,
              paymentMethod: "PIX",
            },
          });
        }
      }
    }
  }

  // --- MÉTODOS PÚBLICOS DO CLIENTE (SEM LOGIN) ---

  async findByPublicToken(publicToken: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { publicToken },
      include: {
        tenant: { select: { tradeName: true, phone: true, email: true, logoUrl: true, settings: true } },
        client: { select: { name: true, phone: true } },
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Ordem de Serviço pública não encontrada.");
    }

    return order;
  }

  async clientApprove(publicToken: string, dto: ClientApproveDto) {
    const order = await this.findByPublicToken(publicToken);

    if (order.status !== "AWAITING_APPROVAL" && order.status !== "TRIAGE" && order.status !== "ANALYSIS") {
      throw new BadRequestException("Esta OS já foi aprovada ou não está em fase de aprovação.");
    }

    return this.prisma.serviceOrder.update({
      where: { publicToken },
      data: {
        status: OsStatus.APPROVED,
        clientSignatureUrl: dto.signatureDataUrl || null,
      },
      include: { items: true, client: true },
    });
  }
}
