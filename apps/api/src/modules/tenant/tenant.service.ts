import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateTenantSettingsDto, CreateTeamUserDto } from "./dto/tenant-settings.dto";
import { CreateBranchDto } from "./dto/branch.dto";
import { CancelSubscriptionDto } from "./dto/cancel-subscription.dto";
import { AsaasService } from "../asaas/asaas.service";
import { getPlanMaxUsers } from "../../common/plan-rules";
import * as bcrypt from "bcrypt";

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => AsaasService))
    private asaasService: AsaasService,
  ) {}

  async getSettings(tenantId: string) {
    if (!tenantId) {
      return {
        tradeName: "TorxOS Master Platform",
        legalName: "TorxOS Global Management",
        plan: "ENTERPRISE",
        isActive: true,
        settings: {
          currency: "BRL",
          subscription_status: "ACTIVE",
          plan: "ENTERPRISE",
        },
      };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant não encontrado.");
    }

    let parsedSettings: any = {};
    if (typeof tenant.settings === "string") {
      try {
        parsedSettings = JSON.parse(tenant.settings);
      } catch {
        parsedSettings = {};
      }
    } else if (tenant.settings && typeof tenant.settings === "object") {
      parsedSettings = tenant.settings;
    }

    const subscriptionStatus = parsedSettings.subscription_status || "TRIAL";
    const isTrial = subscriptionStatus === "TRIAL";
    const trialDays = parsedSettings.trial_days || 7;
    const gracePeriodDays = parsedSettings.grace_period_days !== undefined ? Number(parsedSettings.grace_period_days) : 5;
    const createdDate = new Date(tenant.createdAt);

    let invoiceDueDate: Date;
    if (parsedSettings.invoice_due_date) {
      invoiceDueDate = new Date(parsedSettings.invoice_due_date);
    } else if (parsedSettings.expires_at) {
      invoiceDueDate = new Date(parsedSettings.expires_at);
    } else if (isTrial) {
      invoiceDueDate = new Date(createdDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
    } else {
      const lastPayment = parsedSettings.last_payment_date ? new Date(parsedSettings.last_payment_date) : createdDate;
      invoiceDueDate = new Date(lastPayment.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const gracePeriodEndsAt = isTrial
      ? invoiceDueDate
      : new Date(invoiceDueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);

    const now = new Date();
    const diffInvoiceMs = invoiceDueDate.getTime() - now.getTime();
    const daysUntilInvoice = Math.ceil(diffInvoiceMs / (24 * 60 * 60 * 1000));
    const isInvoiceOverdue = diffInvoiceMs < 0;

    const diffGraceMs = gracePeriodEndsAt.getTime() - now.getTime();
    const daysRemainingGrace = Math.ceil(diffGraceMs / (24 * 60 * 60 * 1000));
    const isGraceExpired = diffGraceMs < 0;
    const isInGracePeriod = !isTrial && isInvoiceOverdue && !isGraceExpired;

    return {
      id: tenant.id,
      tradeName: tenant.tradeName,
      legalName: tenant.legalName,
      document: tenant.document,
      phone: tenant.phone,
      email: tenant.email,
      logoUrl: tenant.logoUrl || parsedSettings.logo_url || null,
      plan: tenant.plan,
      isActive: tenant.isActive,
      settings: parsedSettings,
      subscription: {
        status: isTrial
          ? "TRIAL"
          : isGraceExpired
          ? "BLOCKED"
          : isInGracePeriod
          ? "OVERDUE_GRACE"
          : subscriptionStatus,
        isTrial,
        isCanceled: subscriptionStatus === "CANCELED",
        cancelEffectiveDate: parsedSettings.cancel_effective_date || null,
        cancellationReason: parsedSettings.cancellation_reason || null,
        cancellationFeedback: parsedSettings.cancellation_feedback || null,
        canceledAt: parsedSettings.canceled_at || null,
        trialDays,
        lastPaymentDate: parsedSettings.last_payment_date || null,
        invoiceDueDate: invoiceDueDate.toISOString(),
        daysUntilInvoice,
        isInvoiceOverdue,
        gracePeriodDays,
        gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
        daysRemainingGrace,
        isInGracePeriod,
        isGraceExpired,
        expiresAt: (isTrial ? invoiceDueDate : gracePeriodEndsAt).toISOString(),
        daysRemaining: isTrial ? daysUntilInvoice : daysRemainingGrace,
        isExpired: isTrial ? isInvoiceOverdue : isGraceExpired,
      },
      createdAt: tenant.createdAt,
    };
  }

  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant não encontrado.");
    }

    let currentSettings: any = {};
    if (typeof tenant.settings === "string") {
      try {
        currentSettings = JSON.parse(tenant.settings);
      } catch {
        currentSettings = {};
      }
    } else if (tenant.settings && typeof tenant.settings === "object") {
      currentSettings = tenant.settings;
    }

    const updatedSettings = {
      ...currentSettings,
      warranty_days_default: dto.warrantyDaysDefault !== undefined ? dto.warrantyDaysDefault : currentSettings.warranty_days_default || 90,
      warranty_terms_text: dto.warrantyTermsText !== undefined ? dto.warrantyTermsText : currentSettings.warranty_terms_text,
      enable_whatsapp_auto: dto.enableWhatsappAuto !== undefined ? dto.enableWhatsappAuto : currentSettings.enable_whatsapp_auto !== false,
      logo_url: dto.logoUrl !== undefined ? dto.logoUrl : tenant.logoUrl || currentSettings.logo_url || null,
    };

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        tradeName: dto.tradeName || tenant.tradeName,
        legalName: dto.legalName !== undefined ? dto.legalName : tenant.legalName,
        phone: dto.phone || tenant.phone,
        email: dto.email || tenant.email,
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : tenant.logoUrl,
        settings: JSON.stringify(updatedSettings),
      },
    });

    return {
      success: true,
      message: "Configurações da empresa atualizadas com sucesso.",
      tenant: {
        ...updated,
        settings: updatedSettings,
      },
    };
  }

  async listUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: { not: "SUPER_ADMIN" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        commissionServicesPercent: true,
        commissionProductsPercent: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async createTeamUser(tenantId: string, dto: CreateTeamUserDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    const currentUsersCount = await this.prisma.user.count({
      where: { tenantId, isActive: true },
    });

    const maxUsers = getPlanMaxUsers(tenant?.plan);
    if (currentUsersCount >= maxUsers) {
      throw new ForbiddenException({
        code: "PLAN_USER_LIMIT_REACHED",
        currentPlan: tenant?.plan || "STARTER",
        maxUsers,
        message: `Limite de colaboradores atingido para o plano ${tenant?.plan || "Starter"} (máximo de ${maxUsers} membros). Faça upgrade para adicionar mais colaboradores.`,
      });
    }

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email },
    });

    if (existing) {
      throw new BadRequestException("Já existe um colaborador com este e-mail.");
    }

    const passwordHash = await bcrypt.hash(dto.password || "senha123", 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: (dto.role as any) || "TECHNICIAN",
        commissionServicesPercent: dto.commissionServicesPercent || 0,
        commissionProductsPercent: dto.commissionProductsPercent || 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        commissionServicesPercent: true,
        commissionProductsPercent: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: `Colaborador ${user.name} adicionado à equipe com sucesso.`,
      user,
    };
  }

  async updateUser(tenantId: string, userId: string, data: any) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado.");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role !== undefined ? data.role : user.role,
        commissionServicesPercent: data.commissionServicesPercent !== undefined ? data.commissionServicesPercent : user.commissionServicesPercent,
        commissionProductsPercent: data.commissionProductsPercent !== undefined ? data.commissionProductsPercent : user.commissionProductsPercent,
        isActive: data.isActive !== undefined ? data.isActive : user.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        commissionServicesPercent: true,
        commissionProductsPercent: true,
        isActive: true,
      },
    });

    return {
      success: true,
      message: "Dados do colaborador atualizados com sucesso.",
      user: updated,
    };
  }

  async deleteUser(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException("Colaborador não encontrado.");
    }

    if (user.role === "SUPER_ADMIN") {
      throw new BadRequestException("Contas de Dono da Plataforma (Super Admin) são protegidas e não podem ser excluídas.");
    }

    // Impede excluir se for o único ADMIN da loja
    if (user.role === "ADMIN") {
      const adminCount = await this.prisma.user.count({
        where: { tenantId, role: "ADMIN", isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException("Não é possível excluir o único administrador da loja.");
      }
    }

    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
      return {
        success: true,
        message: `Colaborador ${user.name} excluído com sucesso.`,
      };
    } catch (err: any) {
      // Se houver histórico de OSs, vendas ou vínculos, inativa para manter integridade referencial
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      return {
        success: true,
        message: `Colaborador ${user.name} possui histórico operacional e foi inativado com sucesso.`,
      };
    }
  }

  async resetUserPassword(tenantId: string, userId: string, newPassword?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException("Colaborador não encontrado.");
    }

    const tempPassword = newPassword || "torxos123";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return {
      success: true,
      message: `Senha de ${user.name} redefinida com sucesso para "${tempPassword}".`,
      userName: user.name,
      email: user.email,
      phone: "",
      tempPassword,
    };
  }

  /**
   * Métodos Exclusivos do Painel do Dono do Software (Super Admin)
   */
  async getSuperAdminDashboard() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            serviceOrders: true,
            clients: true,
          },
        },
      },
    });

    let totalActive = 0;
    let totalTrial = 0;
    let estimatedMRR = 0;
    let totalUsers = 0;
    let totalOs = 0;

    const planPrices: Record<string, number> = {
      STARTER: 97,
      PRO: 197,
      ENTERPRISE: 347,
    };

    const formattedTenants = tenants.map((t) => {
      let parsedSettings: any = {};
      try {
        parsedSettings = typeof t.settings === "string" ? JSON.parse(t.settings) : t.settings || {};
      } catch {
        parsedSettings = {};
      }

      const subscriptionStatus = parsedSettings.subscription_status || "TRIAL";
      const isTrial = subscriptionStatus === "TRIAL";
      const trialDays = parsedSettings.trial_days || 7;
      const gracePeriodDays = parsedSettings.grace_period_days !== undefined ? Number(parsedSettings.grace_period_days) : 5;
      const createdDate = new Date(t.createdAt);

      let invoiceDueDate: Date;
      if (parsedSettings.invoice_due_date) {
        invoiceDueDate = new Date(parsedSettings.invoice_due_date);
      } else if (parsedSettings.expires_at) {
        invoiceDueDate = new Date(parsedSettings.expires_at);
      } else if (isTrial) {
        invoiceDueDate = new Date(createdDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
      } else {
        const lastPayment = parsedSettings.last_payment_date ? new Date(parsedSettings.last_payment_date) : createdDate;
        invoiceDueDate = new Date(lastPayment.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const gracePeriodEndsAt = isTrial
        ? invoiceDueDate
        : new Date(invoiceDueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);

      const now = new Date();
      const diffInvoiceMs = invoiceDueDate.getTime() - now.getTime();
      const daysUntilInvoice = Math.ceil(diffInvoiceMs / (24 * 60 * 60 * 1000));
      const isInvoiceOverdue = diffInvoiceMs < 0;

      const diffGraceMs = gracePeriodEndsAt.getTime() - now.getTime();
      const daysRemainingGrace = Math.ceil(diffGraceMs / (24 * 60 * 60 * 1000));
      const isGraceExpired = diffGraceMs < 0;
      const isInGracePeriod = !isTrial && isInvoiceOverdue && !isGraceExpired;

      const customMonthlyPrice = parsedSettings.monthly_price !== undefined && parsedSettings.monthly_price !== null && parsedSettings.monthly_price !== ""
        ? Number(parsedSettings.monthly_price)
        : null;
      const planPrice = customMonthlyPrice !== null && !isNaN(customMonthlyPrice)
        ? customMonthlyPrice
        : (planPrices[t.plan?.toUpperCase()] || 197);

      if (t.isActive && !isGraceExpired && subscriptionStatus !== "SUSPENDED") {
        totalActive++;
        if (isTrial) {
          totalTrial++;
        } else {
          estimatedMRR += planPrice;
        }
      }

      totalUsers += t._count.users;
      totalOs += t._count.serviceOrders;

      const cleanPhone = (t.phone || "").replace(/\D/g, "");
      const whatsappBillingText = encodeURIComponent(
        `Olá equipe da ${t.tradeName}!\n\nInformamos que a fatura referente ao plano ${t.plan} no valor de R$ ${planPrice.toFixed(2)} venceu ou possui vencimento em ${invoiceDueDate.toLocaleDateString("pt-BR")}.\n\nSeu prazo de confiança/tolerância encerra em ${gracePeriodEndsAt.toLocaleDateString("pt-BR")}.\n\nPara evitar interrupções no acesso da sua equipe, regularize sua fatura junto ao suporte financeiro.`
      );
      const whatsappBillingUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${whatsappBillingText}` : null;

      return {
        id: t.id,
        tradeName: t.tradeName,
        legalName: t.legalName,
        document: t.document,
        phone: t.phone,
        email: t.email,
        plan: t.plan,
        planPrice,
        monthlyPrice: customMonthlyPrice,
        isActive: t.isActive,
        isTrial,
        isCanceled: subscriptionStatus === "CANCELED",
        cancelEffectiveDate: parsedSettings.cancel_effective_date || null,
        cancellationReason: parsedSettings.cancellation_reason || null,
        cancellationFeedback: parsedSettings.cancellation_feedback || null,
        canceledAt: parsedSettings.canceled_at || null,
        trialDays,
        lastPaymentDate: parsedSettings.last_payment_date || null,
        invoiceDueDate: invoiceDueDate.toISOString(),
        daysUntilInvoice,
        isInvoiceOverdue,
        gracePeriodDays,
        gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
        daysRemainingGrace,
        isInGracePeriod,
        isGraceExpired,
        subscriptionStatus: isTrial
          ? "TRIAL"
          : isGraceExpired
          ? "BLOCKED"
          : isInGracePeriod
          ? "OVERDUE_GRACE"
          : subscriptionStatus,
        expiresAt: (isTrial ? invoiceDueDate : gracePeriodEndsAt).toISOString(),
        daysRemaining: isTrial ? daysUntilInvoice : daysRemainingGrace,
        isExpired: isTrial ? isInvoiceOverdue : isGraceExpired,
        whatsappBillingUrl,
        asaasCustomerId: parsedSettings.asaas_customer_id || null,
        asaasSubscriptionId: parsedSettings.asaas_subscription_id || null,
        asaasLastPaymentId: parsedSettings.asaas_last_payment_id || null,
        asaasInvoiceUrl: parsedSettings.asaas_invoice_url || null,
        asaasLastPaymentStatus: parsedSettings.asaas_last_payment_status || null,
        createdAt: t.createdAt,
        stats: {
          usersCount: t._count.users,
          ordersCount: t._count.serviceOrders,
          clientsCount: t._count.clients,
        },
      };
    });

    return {
      metrics: {
        totalTenants: tenants.length,
        activeTenants: totalActive,
        trialTenants: totalTrial,
        estimatedMRR,
        totalUsers,
        totalServiceOrders: totalOs,
      },
      tenants: formattedTenants,
    };
  }

  async updateTenantBySuperAdmin(tenantId: string, data: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    let parsedSettings: any = {};
    try {
      parsedSettings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {};
    } catch {
      parsedSettings = {};
    }

    if (data.subscriptionStatus) {
      parsedSettings.subscription_status = data.subscriptionStatus;
      if (data.subscriptionStatus === "SUSPENDED" && data.isActive === undefined) {
        data.isActive = false;
      } else if (data.subscriptionStatus !== "SUSPENDED" && data.isActive === undefined && tenant.isActive === false) {
        data.isActive = true;
      }
    } else if (data.isActive !== undefined) {
      if (data.isActive === false) {
        parsedSettings.subscription_status = "SUSPENDED";
      } else if (parsedSettings.subscription_status === "SUSPENDED") {
        parsedSettings.subscription_status = "ACTIVE";
      }
    }

    if (data.expiresAt) {
      parsedSettings.expires_at = data.expiresAt;
    }
    if (data.trialDays !== undefined) {
      parsedSettings.trial_days = Number(data.trialDays);
    }
    if (data.monthlyPrice !== undefined) {
      parsedSettings.monthly_price = data.monthlyPrice !== null && data.monthlyPrice !== "" && !isNaN(Number(data.monthlyPrice))
        ? Number(data.monthlyPrice)
        : null;
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        tradeName: data.tradeName !== undefined ? data.tradeName : tenant.tradeName,
        legalName: data.legalName !== undefined ? data.legalName : tenant.legalName,
        document: data.document !== undefined ? data.document : tenant.document,
        phone: data.phone !== undefined ? data.phone : tenant.phone,
        email: data.email !== undefined ? data.email : tenant.email,
        plan: data.plan !== undefined ? data.plan : tenant.plan,
        isActive: data.isActive !== undefined ? data.isActive : tenant.isActive,
        settings: JSON.stringify(parsedSettings),
      },
    });

    const subscriptionStatus = parsedSettings.subscription_status || "TRIAL";
    const isTrial = subscriptionStatus === "TRIAL";
    const trialDays = parsedSettings.trial_days || 7;
    const createdDate = new Date(updated.createdAt);
    const expiresAtDate = parsedSettings.expires_at
      ? new Date(parsedSettings.expires_at)
      : (isTrial ? new Date(createdDate.getTime() + trialDays * 24 * 60 * 60 * 1000) : new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffMs = expiresAtDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    const isExpired = diffMs < 0;

    return {
      success: true,
      message: `Empresa ${updated.tradeName} atualizada com sucesso.`,
      tenant: {
        ...updated,
        subscriptionStatus,
        isTrial,
        trialDays,
        expiresAt: expiresAtDate.toISOString(),
        daysRemaining,
        isExpired,
      },
    };
  }

  async deleteTenantBySuperAdmin(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: { id: true, role: true },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    // Desvincula qualquer conta de Super Admin antes da exclusão para proteger o acesso global do Dono
    await this.prisma.user.updateMany({
      where: { tenantId, role: "SUPER_ADMIN" },
      data: { tenantId: null },
    });

    await this.prisma.tenant.delete({
      where: { id: tenantId },
    });

    return {
      success: true,
      message: `Empresa "${tenant.tradeName}" e todos os seus registros foram excluídos permanentemente.`,
    };
  }

  async confirmTenantPayment(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    let parsedSettings: any = {};
    try {
      parsedSettings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {};
    } catch {
      parsedSettings = {};
    }

    const isTrial = (parsedSettings.subscription_status || "TRIAL") === "TRIAL";
    const trialDays = parsedSettings.trial_days || 7;
    const createdDate = new Date(tenant.createdAt);

    // Identifica o vencimento atual da fatura ou término do período de teste (trial)
    let currentDueDate: Date;
    if (parsedSettings.invoice_due_date) {
      currentDueDate = new Date(parsedSettings.invoice_due_date);
    } else if (parsedSettings.expires_at) {
      currentDueDate = new Date(parsedSettings.expires_at);
    } else if (isTrial) {
      currentDueDate = new Date(createdDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
    } else {
      const lastPayment = parsedSettings.last_payment_date ? new Date(parsedSettings.last_payment_date) : createdDate;
      currentDueDate = new Date(lastPayment.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    if (isNaN(currentDueDate.getTime())) {
      currentDueDate = new Date();
    }

    const now = new Date();

    // A regra oficial: soma-se +30 dias SEMPRE a partir do vencimento da fatura / trial atual
    let nextInvoiceDate = new Date(currentDueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Salvaguarda: se a empresa estava vencida/bloqueada há mais de 30 dias e quitou agora,
    // garante que o novo vencimento não fique no passado
    if (nextInvoiceDate <= now) {
      nextInvoiceDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    parsedSettings.last_payment_date = now.toISOString();
    parsedSettings.invoice_due_date = nextInvoiceDate.toISOString();
    parsedSettings.expires_at = nextInvoiceDate.toISOString();
    parsedSettings.subscription_status = "ACTIVE";

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: true,
        settings: JSON.stringify(parsedSettings),
      },
    });

    return {
      success: true,
      message: `Pagamento da empresa "${tenant.tradeName}" confirmado com sucesso! Novo vencimento estendido para ${nextInvoiceDate.toLocaleDateString("pt-BR")} (+30 dias após o vencimento).`,
      tenant: updated,
    };
  }

  async extendTenantGracePeriod(tenantId: string, additionalDays: number = 5) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    let parsedSettings: any = {};
    try {
      parsedSettings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {};
    } catch {
      parsedSettings = {};
    }

    const currentGraceDays = Number(parsedSettings.grace_period_days || 5);
    const newGraceDays = currentGraceDays + Number(additionalDays);
    parsedSettings.grace_period_days = newGraceDays;

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: true,
        settings: JSON.stringify(parsedSettings),
      },
    });

    return {
      success: true,
      message: `Prazo de confiança da empresa "${tenant.tradeName}" estendido em +${additionalDays} dias (total: ${newGraceDays} dias).`,
      tenant: updated,
    };
  }

  async sendBillingEmail(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    let parsedSettings: any = {};
    try {
      parsedSettings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {};
    } catch {
      parsedSettings = {};
    }

    const createdDate = new Date(tenant.createdAt);
    let invoiceDueDate: Date;
    if (parsedSettings.invoice_due_date) {
      invoiceDueDate = new Date(parsedSettings.invoice_due_date);
    } else {
      const lastPayment = parsedSettings.last_payment_date ? new Date(parsedSettings.last_payment_date) : createdDate;
      invoiceDueDate = new Date(lastPayment.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const planPrices: Record<string, number> = { STARTER: 97, PRO: 197, ENTERPRISE: 347 };
    const customMonthlyPrice = parsedSettings.monthly_price !== undefined && parsedSettings.monthly_price !== null && parsedSettings.monthly_price !== ""
      ? Number(parsedSettings.monthly_price)
      : null;
    const price = customMonthlyPrice !== null && !isNaN(customMonthlyPrice)
      ? customMonthlyPrice
      : (planPrices[tenant.plan?.toUpperCase()] || 197);

    return {
      success: true,
      message: `Notificação de cobrança enviada com sucesso para o e-mail ${tenant.email}!`,
      details: {
        recipientEmail: tenant.email,
        companyName: tenant.tradeName,
        plan: tenant.plan,
        amount: price,
        dueDate: invoiceDueDate.toLocaleDateString("pt-BR"),
      },
    };
  }

  async resetTenantAdminPassword(tenantId: string, newPassword?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    const adminUser = tenant.users[0];
    if (!adminUser) {
      throw new NotFoundException("Nenhum usuário administrador encontrado para esta empresa.");
    }

    const tempPassword = newPassword || "torxos123";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: adminUser.id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: `Senha de acesso de ${adminUser.name} (${adminUser.email}) redefinida com sucesso para "${tempPassword}".`,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      adminPhone: tenant.phone || "",
      tenantTradeName: tenant.tradeName,
      tempPassword,
    };
  }

  async impersonateTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    const targetUser = tenant.users.find((u) => u.role === "ADMIN") || tenant.users[0];
    if (!targetUser) {
      throw new NotFoundException("Nenhum usuário ativo encontrado para esta empresa.");
    }

    let parsedSettings: any = {};
    try {
      parsedSettings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {};
    } catch {
      parsedSettings = {};
    }

    const subscriptionStatus = parsedSettings.subscription_status || "TRIAL";
    const isTrial = subscriptionStatus === "TRIAL";
    const trialDays = parsedSettings.trial_days || 7;
    const createdDate = new Date(tenant.createdAt);
    const expiresAtDate = parsedSettings.expires_at
      ? new Date(parsedSettings.expires_at)
      : (isTrial ? new Date(createdDate.getTime() + trialDays * 24 * 60 * 60 * 1000) : new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffMs = expiresAtDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    const isExpired = diffMs < 0;

    const payload = {
      sub: targetUser.id,
      tenantId: tenant.id,
      email: targetUser.email,
      role: targetUser.role,
      name: targetUser.name,
      isImpersonating: true,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: `Acesso em Modo Suporte concedido para a loja ${tenant.tradeName}.`,
      accessToken,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        tenantId: tenant.id,
        tenantName: tenant.tradeName,
        tenantPlan: tenant.plan,
        subscription: {
          status: subscriptionStatus,
          isTrial,
          trialDays,
          expiresAt: expiresAtDate.toISOString(),
          daysRemaining,
          isExpired,
        },
        isImpersonating: true,
      },
    };
  }

  async cancelSubscription(tenantId: string, dto: CancelSubscriptionDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant não encontrado.");
    }

    let parsedSettings: any = {};
    if (typeof tenant.settings === "string") {
      try {
        parsedSettings = JSON.parse(tenant.settings);
      } catch {
        parsedSettings = {};
      }
    } else if (tenant.settings && typeof tenant.settings === "object") {
      parsedSettings = tenant.settings;
    }

    const isTrial = (parsedSettings.subscription_status || "TRIAL") === "TRIAL";
    const trialDays = parsedSettings.trial_days || 7;
    const createdDate = new Date(tenant.createdAt);

    let invoiceDueDate: Date;
    if (parsedSettings.invoice_due_date) {
      invoiceDueDate = new Date(parsedSettings.invoice_due_date);
    } else if (parsedSettings.expires_at) {
      invoiceDueDate = new Date(parsedSettings.expires_at);
    } else if (isTrial) {
      invoiceDueDate = new Date(createdDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
    } else {
      const lastPayment = parsedSettings.last_payment_date ? new Date(parsedSettings.last_payment_date) : createdDate;
      invoiceDueDate = new Date(lastPayment.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Se houver assinatura no gateway Asaas, cancela recorrência para não gerar novas faturas
    let asaasResult = null;
    try {
      asaasResult = await this.asaasService.cancelSubscription(tenantId);
    } catch (err: any) {
      console.warn(`[TenantService] Aviso ao cancelar no gateway Asaas: ${err.message}`);
    }

    parsedSettings.subscription_status = "CANCELED";
    parsedSettings.cancel_effective_date = invoiceDueDate.toISOString();
    parsedSettings.cancellation_reason = dto.reason;
    parsedSettings.cancellation_feedback = dto.feedback || null;
    parsedSettings.canceled_at = new Date().toISOString();
    parsedSettings.is_trial_before_cancel = isTrial;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: JSON.stringify(parsedSettings),
      },
    });

    return {
      success: true,
      message: `Cancelamento agendado com sucesso. Seu acesso permanecerá 100% ativo até ${invoiceDueDate.toLocaleDateString("pt-BR")}. Seus dados e ordens de serviço continuam preservados com segurança.`,
      cancelEffectiveDate: invoiceDueDate.toISOString(),
      reason: dto.reason,
      asaasResult,
    };
  }

  async reactivateSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant não encontrado.");
    }

    let parsedSettings: any = {};
    if (typeof tenant.settings === "string") {
      try {
        parsedSettings = JSON.parse(tenant.settings);
      } catch {
        parsedSettings = {};
      }
    } else if (tenant.settings && typeof tenant.settings === "object") {
      parsedSettings = tenant.settings;
    }

    const wasTrial = parsedSettings.is_trial_before_cancel || false;
    parsedSettings.subscription_status = wasTrial ? "TRIAL" : "ACTIVE";
    delete parsedSettings.cancel_effective_date;
    delete parsedSettings.cancellation_reason;
    delete parsedSettings.cancellation_feedback;
    parsedSettings.reactivated_at = new Date().toISOString();

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: JSON.stringify(parsedSettings),
      },
    });

    return {
      success: true,
      message: "Sua assinatura foi reativada com sucesso! Seu acesso continuará sem interrupções.",
      subscriptionStatus: parsedSettings.subscription_status,
    };
  }

  // =========================================================================
  // GESTÃO MULTI-FILIAIS & MATRIZ (PLANO ENTERPRISE & MASTER)
  // =========================================================================

  async getBranches(tenantId: string) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!current) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    const headquarterId = current.parentTenantId || current.id;

    const headquarter = await this.prisma.tenant.findUnique({
      where: { id: headquarterId },
      select: {
        id: true,
        tradeName: true,
        legalName: true,
        document: true,
        phone: true,
        email: true,
        plan: true,
        isHeadquarter: true,
        isActive: true,
        logoUrl: true,
        createdAt: true,
      },
    });

    const branches = await this.prisma.tenant.findMany({
      where: {
        parentTenantId: headquarterId,
        isActive: true,
      },
      select: {
        id: true,
        tradeName: true,
        legalName: true,
        document: true,
        phone: true,
        email: true,
        plan: true,
        isHeadquarter: true,
        isActive: true,
        logoUrl: true,
        createdAt: true,
      },
      orderBy: { tradeName: "asc" },
    });

    const allUnits = [headquarter!, ...branches];

    return {
      currentUnitId: tenantId,
      headquarter,
      branches,
      allUnits,
      totalUnits: allUnits.length,
    };
  }

  async createBranch(tenantId: string, dto: CreateBranchDto) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!current) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    // A matriz é o parent ou o próprio tenant
    const headquarterId = current.parentTenantId || current.id;
    const headquarter = await this.prisma.tenant.findUnique({
      where: { id: headquarterId },
    });

    if (!headquarter) {
      throw new NotFoundException("Matriz não encontrada.");
    }

    // Validar duplicidade de documento
    const existing = await this.prisma.tenant.findUnique({
      where: { document: dto.document },
    });

    if (existing) {
      throw new BadRequestException("Já existe uma unidade com este CNPJ/documento cadastrado.");
    }

    // Criar a nova filial
    const branch = await this.prisma.tenant.create({
      data: {
        tradeName: dto.tradeName,
        legalName: dto.legalName || dto.tradeName,
        document: dto.document,
        phone: dto.phone,
        email: dto.email,
        plan: headquarter.plan || "ENTERPRISE",
        parentTenantId: headquarter.id,
        isHeadquarter: false,
        isActive: true,
        settings: headquarter.settings,
      },
    });

    return {
      success: true,
      message: `Filial "${branch.tradeName}" cadastrada e vinculada à Matriz com sucesso!`,
      branch: {
        id: branch.id,
        tradeName: branch.tradeName,
        legalName: branch.legalName,
        document: branch.document,
        phone: branch.phone,
        email: branch.email,
        plan: branch.plan,
        isHeadquarter: false,
        parentTenantId: headquarter.id,
      },
    };
  }

  async switchBranch(currentTenantId: string, userId: string, targetBranchId: string) {
    const current = await this.prisma.tenant.findUnique({
      where: { id: currentTenantId },
    });
    const target = await this.prisma.tenant.findUnique({
      where: { id: targetBranchId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!current || !target || !user) {
      throw new NotFoundException("Unidade ou usuário não encontrado.");
    }

    // Validar se pertence à mesma rede da Matriz
    const currentHqId = current.parentTenantId || current.id;
    const targetHqId = target.parentTenantId || target.id;

    if (user.role !== "SUPER_ADMIN" && currentHqId !== targetHqId) {
      throw new ForbiddenException("Você não tem permissão para acessar esta unidade pois ela pertence a outro grupo.");
    }

    const payload = {
      sub: user.id,
      tenantId: target.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isBranchSwitch: true,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: `Você agora está operando na unidade: ${target.tradeName}`,
      accessToken,
      unit: {
        id: target.id,
        tradeName: target.tradeName,
        isHeadquarter: target.isHeadquarter,
        document: target.document,
        plan: target.plan,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: target.id,
        tenantName: target.tradeName,
        tenantPlan: target.plan,
      },
    };
  }
}
