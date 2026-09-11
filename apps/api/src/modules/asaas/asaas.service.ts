import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantService } from "../tenant/tenant.service";

/**
 * AsaasService — Integração com a API v3 do Asaas para cobrança recorrente
 * de mensalidades das assistências técnicas cadastradas no TorxOS.
 *
 * Ambiente Sandbox: https://sandbox.asaas.com/api/v3
 * Ambiente Produção: https://api.asaas.com/api/v3
 */
@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly webhookToken: string;

  private readonly PLAN_PRICES: Record<string, number> = {
    STARTER: 97,
    PRO: 197,
    ENTERPRISE: 347,
  };

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => TenantService))
    private tenantService: TenantService,
  ) {
    let rawUrl = this.configService.get<string>("ASAAS_API_URL") || "https://api.asaas.com/v3";
    // Normaliza URLs incorretas como /api/v3 para o endpoint oficial v3
    rawUrl = rawUrl.replace("/api/v3", "/v3").replace(/\/+$/, "");
    this.apiUrl = rawUrl;
    this.apiKey = this.configService.get<string>("ASAAS_API_KEY") || "";
    this.webhookToken = this.configService.get<string>("ASAAS_WEBHOOK_TOKEN") || "torxos_webhook_secret_2026";
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private async asaasFetch(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.apiUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "TorxOS-SaaS/1.0",
      access_token: this.apiKey,
      ...(options.headers as Record<string, string> || {}),
    };

    this.logger.log(`[Asaas] ${options.method || "GET"} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      this.logger.error(`[Asaas] Erro ${response.status}: ${JSON.stringify(data)}`);
      throw new Error(`Asaas API error ${response.status}: ${JSON.stringify(data?.errors || data)}`);
    }

    return data;
  }

  private getTenantSettings(tenant: any): any {
    let parsedSettings: any = {};
    try {
      parsedSettings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {};
    } catch {
      parsedSettings = {};
    }
    return parsedSettings;
  }

  private async saveTenantSettings(tenantId: string, settings: any): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: JSON.stringify(settings) },
    });
  }

  // =========================================================================
  // 1. CUSTOMER — Sincronizar Tenant como Cliente no Asaas
  // =========================================================================

  async createOrUpdateCustomer(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Empresa não encontrada.");

    const settings = this.getTenantSettings(tenant);

    // Se já tem um customer no Asaas, atualiza
    if (settings.asaas_customer_id) {
      try {
        const updated = await this.asaasFetch(`/customers/${settings.asaas_customer_id}`, {
          method: "POST",
          body: JSON.stringify({
            name: tenant.tradeName,
            email: tenant.email,
            phone: tenant.phone?.replace(/\D/g, "") || undefined,
            cpfCnpj: tenant.document?.replace(/\D/g, "") || undefined,
            externalReference: tenant.id,
          }),
        });
        this.logger.log(`[Asaas] Customer atualizado: ${updated.id}`);
        return { success: true, customerId: updated.id, action: "updated" };
      } catch (err: any) {
        this.logger.warn(`[Asaas] Falha ao atualizar customer, criando novo: ${err.message}`);
      }
    }

    // Cria novo customer
    const created = await this.asaasFetch("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: tenant.tradeName,
        email: tenant.email,
        phone: tenant.phone?.replace(/\D/g, "") || undefined,
        cpfCnpj: tenant.document?.replace(/\D/g, "") || undefined,
        externalReference: tenant.id,
        notificationDisabled: false,
      }),
    });

    settings.asaas_customer_id = created.id;
    await this.saveTenantSettings(tenantId, settings);

    this.logger.log(`[Asaas] Customer criado: ${created.id} para tenant: ${tenant.tradeName}`);
    return { success: true, customerId: created.id, action: "created" };
  }

  private getTenantPrice(tenant: any, settings: any): number {
    if (settings?.monthly_price !== undefined && settings?.monthly_price !== null && settings?.monthly_price !== "" && !isNaN(Number(settings.monthly_price))) {
      return Number(settings.monthly_price);
    }
    return this.PLAN_PRICES[tenant.plan?.toUpperCase()] || 197;
  }

  // =========================================================================
  // 2. SUBSCRIPTION — Criar ou Atualizar Assinatura Recorrente Mensal
  // =========================================================================

  async createSubscription(tenantId: string, billingType: string = "UNDEFINED") {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Empresa não encontrada.");

    const settings = this.getTenantSettings(tenant);

    // Garante que o customer existe no Asaas
    if (!settings.asaas_customer_id) {
      await this.createOrUpdateCustomer(tenantId);
      // Recarrega settings após criação
      const updated = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      Object.assign(settings, this.getTenantSettings(updated));
    }

    const planPrice = this.getTenantPrice(tenant, settings);

    // Se já possui uma assinatura ativa no Asaas, atualiza o valor e billingType
    if (settings.asaas_subscription_id) {
      try {
        const updatedSub = await this.asaasFetch(`/subscriptions/${settings.asaas_subscription_id}`, {
          method: "POST",
          body: JSON.stringify({
            value: planPrice,
            billingType,
            description: `Mensalidade TorxOS - Plano ${tenant.plan || "PRO"} (${tenant.tradeName})`,
          }),
        });

        settings.asaas_subscription_status = updatedSub.status;
        await this.saveTenantSettings(tenantId, settings);

        this.logger.log(`[Asaas] Assinatura existente ${settings.asaas_subscription_id} atualizada para R$ ${planPrice}/mês`);

        return {
          success: true,
          message: `Assinatura no Asaas atualizada para R$ ${planPrice.toFixed(2)}/mês com sucesso!`,
          subscriptionId: updatedSub.id,
          value: planPrice,
          cycle: updatedSub.cycle || "MONTHLY",
          nextDueDate: updatedSub.nextDueDate,
          billingType,
          action: "updated",
        };
      } catch (err: any) {
        this.logger.warn(`[Asaas] Falha ao atualizar assinatura existente: ${err.message}. Criando nova assinatura...`);
      }
    }

    // Calcula a próxima data de vencimento (próximo ciclo)
    let nextDueDate: string;
    if (settings.invoice_due_date) {
      const due = new Date(settings.invoice_due_date);
      nextDueDate = due > new Date()
        ? due.toISOString().split("T")[0]
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // +3 dias se vencido
    } else {
      nextDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }

    const subscriptionPayload = {
      customer: settings.asaas_customer_id,
      billingType,
      value: planPrice,
      nextDueDate,
      cycle: "MONTHLY",
      description: `Mensalidade TorxOS - Plano ${tenant.plan || "PRO"} (${tenant.tradeName})`,
      externalReference: tenant.id,
    };

    const subscription = await this.asaasFetch("/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscriptionPayload),
    });

    settings.asaas_subscription_id = subscription.id;
    settings.asaas_subscription_status = subscription.status;
    await this.saveTenantSettings(tenantId, settings);

    this.logger.log(`[Asaas] Assinatura criada: ${subscription.id} | R$ ${planPrice}/mês | Plano: ${tenant.plan}`);

    return {
      success: true,
      message: `Assinatura mensal de R$ ${planPrice.toFixed(2)} criada com sucesso para "${tenant.tradeName}"!`,
      subscriptionId: subscription.id,
      value: planPrice,
      cycle: "MONTHLY",
      nextDueDate,
      billingType,
      action: "created",
    };
  }

  /**
   * Cancela a assinatura recorrente no Asaas (DELETE /subscriptions/:id)
   */
  async cancelSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Empresa não encontrada.");

    const settings = this.getTenantSettings(tenant);
    const subId = settings.asaas_subscription_id;

    if (!subId) {
      this.logger.warn(`[Asaas] Tenant ${tenant.tradeName} não possui assinatura ativa no Asaas.`);
      return { success: true, message: "Nenhuma assinatura ativa no Asaas para cancelar." };
    }

    try {
      await this.asaasFetch(`/subscriptions/${subId}`, {
        method: "DELETE",
      });
      this.logger.log(`[Asaas] Assinatura ${subId} cancelada com sucesso para "${tenant.tradeName}"`);
    } catch (err: any) {
      this.logger.error(`[Asaas] Erro ao cancelar assinatura ${subId}: ${err.message}`);
    }

    settings.asaas_subscription_status = "CANCELED";
    await this.saveTenantSettings(tenantId, settings);

    return {
      success: true,
      message: "Assinatura recorrente cancelada com sucesso no gateway Asaas.",
      subscriptionId: subId,
    };
  }

  // =========================================================================
  // 3. CHARGE — Criar Cobrança Avulsa (se necessário)
  // =========================================================================

  async createCharge(tenantId: string, billingType: string = "UNDEFINED") {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Empresa não encontrada.");

    const settings = this.getTenantSettings(tenant);

    // Garante que o customer existe
    if (!settings.asaas_customer_id) {
      await this.createOrUpdateCustomer(tenantId);
      const updated = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      Object.assign(settings, this.getTenantSettings(updated));
    }

    const planPrice = this.getTenantPrice(tenant, settings);

    // Vencimento: próxima data de invoice ou +3 dias a partir de hoje
    let dueDate: string;
    if (settings.invoice_due_date) {
      const due = new Date(settings.invoice_due_date);
      dueDate = due > new Date()
        ? due.toISOString().split("T")[0]
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } else {
      dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }

    const payment = await this.asaasFetch("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: settings.asaas_customer_id,
        billingType,
        value: planPrice,
        dueDate,
        description: `Mensalidade TorxOS - Plano ${tenant.plan || "PRO"} (${tenant.tradeName})`,
        externalReference: tenant.id,
      }),
    });

    settings.asaas_last_payment_id = payment.id;
    settings.asaas_invoice_url = payment.invoiceUrl;
    settings.asaas_bank_slip_url = payment.bankSlipUrl || null;
    await this.saveTenantSettings(tenantId, settings);

    this.logger.log(`[Asaas] Cobrança avulsa criada: ${payment.id} | R$ ${planPrice} | Status: ${payment.status}`);

    return {
      success: true,
      message: `Cobrança de R$ ${planPrice.toFixed(2)} gerada para "${tenant.tradeName}"!`,
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl || null,
      value: planPrice,
      dueDate,
      status: payment.status,
    };
  }

  // =========================================================================
  // 4. CONSULTAR STATUS DO PAGAMENTO
  // =========================================================================

  async getPaymentStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Empresa não encontrada.");

    const settings = this.getTenantSettings(tenant);
    const paymentId = settings.asaas_last_payment_id;

    if (!paymentId) {
      return {
        success: false,
        message: "Nenhuma cobrança registrada para esta empresa.",
        status: "NONE",
      };
    }

    const payment = await this.asaasFetch(`/payments/${paymentId}`);

    return {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      value: payment.value,
      netValue: payment.netValue,
      dueDate: payment.dueDate,
      paymentDate: payment.paymentDate,
      invoiceUrl: payment.invoiceUrl,
      billingType: payment.billingType,
    };
  }

  // =========================================================================
  // 5. PIX QR CODE
  // =========================================================================

  async getPixQrCode(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Empresa não encontrada.");

    const settings = this.getTenantSettings(tenant);
    const paymentId = settings.asaas_last_payment_id;

    if (!paymentId) {
      return { success: false, message: "Nenhuma cobrança ativa com Pix disponível." };
    }

    try {
      const pixData = await this.asaasFetch(`/payments/${paymentId}/pixQrCode`);
      return {
        success: true,
        paymentId,
        encodedImage: pixData.encodedImage,
        payload: pixData.payload,
        expirationDate: pixData.expirationDate,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Não foi possível gerar o QR Code Pix: ${err.message}`,
      };
    }
  }

  // =========================================================================
  // 6. LISTAR ASSINATURAS DE UM TENANT
  // =========================================================================

  async getSubscriptionInfo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error("Empresa não encontrada.");

    const settings = this.getTenantSettings(tenant);
    const subscriptionId = settings.asaas_subscription_id;

    if (!subscriptionId) {
      return {
        success: false,
        message: "Nenhuma assinatura ativa no Asaas para esta empresa.",
        hasSubscription: false,
      };
    }

    try {
      const sub = await this.asaasFetch(`/subscriptions/${subscriptionId}`);
      return {
        success: true,
        hasSubscription: true,
        subscriptionId: sub.id,
        status: sub.status,
        value: sub.value,
        cycle: sub.cycle,
        nextDueDate: sub.nextDueDate,
        billingType: sub.billingType,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro ao consultar assinatura: ${err.message}`,
        hasSubscription: false,
      };
    }
  }

  // =========================================================================
  // 7. WEBHOOK — Processar notificação do Asaas
  // =========================================================================

  validateWebhookToken(token: string): boolean {
    return token === this.webhookToken;
  }

  async processWebhookEvent(event: any) {
    const eventType = event?.event;
    const payment = event?.payment;

    this.logger.log(`[Asaas Webhook] Evento recebido: ${eventType} | Payment ID: ${payment?.id}`);

    if (!payment?.externalReference) {
      this.logger.warn(`[Asaas Webhook] Evento sem externalReference, ignorando.`);
      return { processed: false, reason: "Sem externalReference" };
    }

    const tenantId = payment.externalReference;

    // Verifica se o tenant existe
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      this.logger.warn(`[Asaas Webhook] Tenant não encontrado: ${tenantId}`);
      return { processed: false, reason: "Tenant não encontrado" };
    }

    // Atualiza o ID do último pagamento
    const settings = this.getTenantSettings(tenant);
    settings.asaas_last_payment_id = payment.id;
    settings.asaas_last_webhook_event = eventType;
    settings.asaas_last_webhook_at = new Date().toISOString();

    switch (eventType) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        this.logger.log(`[Asaas Webhook] Pagamento confirmado para tenant: ${tenant.tradeName} (${tenantId})`);

        // Baixa automática: renova +30 dias
        const result = await this.tenantService.confirmTenantPayment(tenantId);

        settings.asaas_last_payment_status = "CONFIRMED";
        settings.asaas_last_payment_date = payment.paymentDate || new Date().toISOString();
        await this.saveTenantSettings(tenantId, settings);

        this.logger.log(`[Asaas Webhook] ✅ Baixa automática realizada: ${result.message}`);

        return {
          processed: true,
          action: "PAYMENT_CONFIRMED",
          tenantId,
          tenantName: tenant.tradeName,
          message: result.message,
        };
      }

      case "PAYMENT_OVERDUE": {
        this.logger.warn(`[Asaas Webhook] ⚠️ Pagamento vencido para tenant: ${tenant.tradeName}`);
        settings.asaas_last_payment_status = "OVERDUE";
        await this.saveTenantSettings(tenantId, settings);

        return {
          processed: true,
          action: "PAYMENT_OVERDUE",
          tenantId,
          tenantName: tenant.tradeName,
        };
      }

      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED": {
        this.logger.warn(`[Asaas Webhook] Pagamento cancelado/estornado: ${tenant.tradeName}`);
        settings.asaas_last_payment_status = eventType;
        await this.saveTenantSettings(tenantId, settings);

        return {
          processed: true,
          action: eventType,
          tenantId,
          tenantName: tenant.tradeName,
        };
      }

      default: {
        this.logger.log(`[Asaas Webhook] Evento não mapeado: ${eventType}`);
        await this.saveTenantSettings(tenantId, settings);
        return { processed: false, reason: `Evento não tratado: ${eventType}` };
      }
    }
  }
}
