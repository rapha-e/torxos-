import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { OnboardingService } from "../onboarding/onboarding.service";
import { LoginDto, RefreshTokenDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private onboardingService: OnboardingService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    if (user.role !== "SUPER_ADMIN") {
      const companyName = user.tenant?.tradeName || "sua empresa";

      if (!user.isActive) {
        throw new UnauthorizedException(`Seu usuário foi inativado. Contate o administrador da empresa ${companyName}.`);
      }

      if (user.tenant && !user.tenant.isActive) {
        throw new UnauthorizedException(`O acesso da empresa ${companyName} está suspenso. Entre em contato com a administração.`);
      }

      let parsedSettings: any = {};
      try {
        parsedSettings = typeof user.tenant?.settings === "string" ? JSON.parse(user.tenant.settings) : user.tenant?.settings || {};
      } catch {
        parsedSettings = {};
      }

      const subscriptionStatus = parsedSettings.subscription_status || "TRIAL";
      const isTrial = subscriptionStatus === "TRIAL";
      const trialDays = parsedSettings.trial_days || 7;
      const gracePeriodDays = parsedSettings.grace_period_days !== undefined ? Number(parsedSettings.grace_period_days) : 5;
      const createdDate = user.tenant ? new Date(user.tenant.createdAt) : new Date();

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
      const isInvoiceOverdue = now > invoiceDueDate;
      const isGraceExpired = now > gracePeriodEndsAt;

      if (subscriptionStatus === "SUSPENDED") {
        throw new UnauthorizedException(`O acesso da empresa ${companyName} está suspenso. Entre em contato com o suporte da plataforma.`);
      }

      if (isTrial) {
        if (isInvoiceOverdue) {
          const formattedDate = invoiceDueDate.toLocaleDateString("pt-BR");
          throw new UnauthorizedException(
            `O acesso da empresa ${companyName} referente ao período de teste grátis (Trial de ${trialDays} dias) encerrou em ${formattedDate}. Para continuar utilizando o sistema, ative sua assinatura junto ao suporte.`
          );
        }
      } else {
        if (isGraceExpired) {
          const formattedGraceDate = gracePeriodEndsAt.toLocaleDateString("pt-BR");
          throw new UnauthorizedException(
            `O acesso da empresa ${companyName} foi bloqueado devido ao vencimento do prazo de confiança em ${formattedGraceDate}. Para liberar o acesso da sua equipe, regularize a fatura junto ao suporte.`
          );
        }
      }
    }

    let parsedSettings: any = {};
    if (user.tenant) {
      try {
        parsedSettings = typeof user.tenant.settings === "string" ? JSON.parse(user.tenant.settings) : user.tenant.settings || {};
      } catch {
        parsedSettings = {};
      }
    }

    const subscriptionStatus = parsedSettings.subscription_status || "TRIAL";
    const isTrial = subscriptionStatus === "TRIAL";
    const trialDays = parsedSettings.trial_days || 7;
    const gracePeriodDays = parsedSettings.grace_period_days !== undefined ? Number(parsedSettings.grace_period_days) : 5;
    const createdDate = user.tenant ? new Date(user.tenant.createdAt) : new Date();

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

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || "torxos_super_refresh_jwt_key_2026_production_ready",
      expiresIn: "7d",
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.tradeName || "Plataforma Master",
        tenantPlan: user.tenant?.plan || "MASTER",
        subscription: {
          status: isTrial
            ? "TRIAL"
            : isGraceExpired
            ? "BLOCKED"
            : isInGracePeriod
            ? "OVERDUE_GRACE"
            : subscriptionStatus,
          isTrial,
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
        },
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const decoded = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "torxos_super_refresh_jwt_key_2026_production_ready",
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { tenant: true },
      });

      if (!user || !user.isActive || (user.tenant && !user.tenant.isActive)) {
        throw new UnauthorizedException("Usuário ou Empresa inativo.");
      }

      const payload = {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado.");
    }
  }

  async register(dto: import("./dto/register.dto").RegisterTenantDto) {
    // 1. Validar se documento ou e-mail já estão cadastrados
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { document: dto.document },
    });

    if (existingTenant) {
      throw new UnauthorizedException("Já existe uma empresa cadastrada com este CNPJ/CPF.");
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new UnauthorizedException("Este e-mail já está em uso por outro usuário.");
    }

    // 2. Criar Tenant (com período de teste Trial de 7 dias)
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const plan = dto.plan?.toUpperCase() || "PRO";

    const defaultSettings = {
      currency: "BRL",
      enable_whatsapp_auto: true,
      warranty_days_default: 90,
      subscription_status: "TRIAL",
      trial_days: 7,
      created_via: "SELF_SERVICE_ONBOARDING",
    };

    const tenant = await this.prisma.tenant.create({
      data: {
        tradeName: dto.tradeName,
        legalName: dto.legalName || dto.tradeName,
        document: dto.document,
        phone: dto.phone,
        email: dto.email.toLowerCase(),
        plan,
        isActive: true,
        settings: JSON.stringify(defaultSettings),
      },
    });

    // 3. Criar usuário Administrador
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: "ADMIN",
        commissionServicesPercent: 0,
        commissionProductsPercent: 0,
        isActive: true,
      },
    });

    // 4. Inicializar Categorias do Plano de Contas Padrão
    await this.prisma.chartOfAccount.createMany({
      data: [
        { tenantId: tenant.id, code: "1.1", name: "Receita de Serviços de Bancada", accountType: "REVENUE" },
        { tenantId: tenant.id, code: "1.2", name: "Receita de Venda de Acessórios e Peças", accountType: "REVENUE" },
        { tenantId: tenant.id, code: "2.1", name: "Custo com Peças de Reposição (CMV)", accountType: "EXPENSE" },
        { tenantId: tenant.id, code: "2.2", name: "Despesas Operacionais e Ferramentas", accountType: "EXPENSE" },
      ],
    });

    // 5. Inicializar Caixa Balcão Padrão
    await this.prisma.bankAccount.create({
      data: {
        tenantId: tenant.id,
        name: "Caixa Gaveta Balcão",
        accountType: "CASH",
        initialBalance: 0,
        currentBalance: 0,
        isActive: true,
      },
    });

    // 6. Gerar Sessão JWT
    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || "torxos_super_refresh_jwt_key_2026_production_ready",
      expiresIn: "7d",
    });

    // 7. Disparar Régua de Boas-Vindas D0 (WhatsApp / Webhook de Ativação)
    this.onboardingService.dispatchWelcomeD0(tenant, user).catch(() => {});

    return {
      message: "Empresa e gestor cadastrados com sucesso! Aproveite seus 7 dias de teste grátis.",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.tradeName,
        plan: tenant.plan,
      },
    };
  }
}
