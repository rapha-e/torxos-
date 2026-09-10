import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  OnboardingStage,
  DispatchOnboardingMessageDto,
  UpdateOnboardingConfigDto,
} from "./dto/onboarding.dto";

export interface OnboardingLead {
  id: string;
  tradeName: string;
  ownerName: string;
  email: string;
  phone: string;
  plan: string;
  daysSinceCreation: number;
  currentStage: OnboardingStage;
  currentStageLabel: string;
  suggestedMessage: string;
  whatsappDirectUrl: string;
  createdAt: string;
  trialEndsAt: string;
  asaasInvoiceUrl?: string | null;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  // Configuração global de envio de WhatsApp (Evolution API / Webhook)
  private config: UpdateOnboardingConfigDto = {
    webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || "",
    apiUrl: process.env.EVOLUTION_API_URL || "",
    apiKey: process.env.EVOLUTION_API_KEY || "",
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || "torxos",
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Templates estratégicos da Régua de 7 Dias de Onboarding
   */
  private readonly stageTemplates = {
    [OnboardingStage.D0_WELCOME]: {
      label: "D0: Boas-vindas & Acesso",
      template: `🎉 *Bem-vindo ao TorxOS, {nome}!*

Parabéns por dar esse passo importante para profissionalizar a gestão da *{empresa}*!

Seu teste gratuito de *7 dias VIP* está liberado com acesso completo a todas as ferramentas.

📲 *Seu link de acesso direto:*
{linkAcesso}

💡 *Primeiro passo recomendado:*
Assista ao nosso tour rápido de 3 minutos no painel para ver como abrir sua primeira Ordem de Serviço em menos de 40 segundos.

Se precisar de qualquer ajuda na configuração, nossa equipe de suporte está à sua disposição aqui mesmo por este WhatsApp!

Tenha uma excelente jornada com o TorxOS! 🚀`,
    },

    [OnboardingStage.D1_FIRST_OS]: {
      label: "D1: Primeira OS & Fotos na Bancada",
      template: `🛠️ *Dica de ouro de bancada para a {empresa}!*

Olá, {nome}! Tudo bem?

Você sabia que a maior causa de dor de cabeça em assistência técnica é a discussão sobre arranhões ou peças que o cliente alega que funcionavam antes?

No TorxOS você resolve isso direto pelo celular:
1. Abra a Ordem de Serviço pelo smartphone ou tablet;
2. Tire até 4 fotos do aparelho na entrada (frente, verso e laterais);
3. As fotos ficam salvas no histórico eterno da OS!

👉 Se ainda não cadastrou sua primeira OS de teste, faça isso hoje mesmo: {linkAcesso}/os/nova

Bons reparos e ótimo trabalho na bancada! ⚡`,
    },

    [OnboardingStage.D3_WHATSAPP_STATUS]: {
      label: "D3: Link de Rastreamento no WhatsApp",
      template: `💬 *Diga adeus ao "Já tá pronto?" no WhatsApp, {nome}!*

Uma das funções mais elogiadas pelos técnicos e donos de assistência no TorxOS é o *Link de Acompanhamento em Tempo Real*.

Quando você altera o status da OS para *"Aguardando Peça"* ou *"Pronto para Retirada"*, o cliente recebe um link exclusivo e vê tudo pelo navegador sem precisar te ligar ou mandar mensagem a cada hora!

Isso economiza até 2 horas por dia de interrupções na sua assistência técnica.

✨ Teste agora na {empresa}: {linkAcesso}/os/kanban

Qualquer dúvida, conte com a gente! 🚀`,
    },

    [OnboardingStage.D5_TRIAL_EXPIRING]: {
      label: "D5: Alerta de Encerramento (48h Restantes)",
      template: `⏳ *Atenção {nome}: faltam 48h para encerrar seu teste VIP!*

Passando para avisar que seu período gratuito de 7 dias da *{empresa}* encerra em 2 dias.

Durante esse período, sua loja já começou a organizar:
✅ Histórico de ordens de serviço e fotos
✅ Controle ágil de peças e inventário
✅ Comunicação profissional com seus clientes

Para garantir que sua equipe continue operando sem bloqueios ou interrupções, você já pode ativar seu plano *{plano}*.

🔗 *Ativar meu plano agora:*
{linkFatura}

Vamos juntos levar a {empresa} para o próximo nível! 💪`,
    },

    [OnboardingStage.D7_CONVERSION]: {
      label: "D7: Encerramento do Teste & Ativação Asaas",
      template: `🚨 *Hoje encerra seu teste VIP no TorxOS, {nome}!*

Hoje é o último dia do período gratuito da *{empresa}*.

Para manter seu histórico, estoque, laudos e acessos da equipe liberados, ative sua assinatura mensal no plano *{plano}*:

💳 *Link seguro para ativação imediata (Pix, Cartão ou Boleto):*
{linkFatura}

Assim que o pagamento for confirmado, seu plano é renovado automaticamente por +30 dias sem nenhuma pausa no seu trabalho.

Dúvidas sobre o plano? Me responda aqui que te ajudo agora mesmo! 🤝`,
    },
  };

  /**
   * Retorna a configuração atual de WhatsApp
   */
  getConfig() {
    return this.config;
  }

  /**
   * Atualiza as configurações de webhook/Evolution API
   */
  updateConfig(dto: UpdateOnboardingConfigDto) {
    this.config = { ...this.config, ...dto };
    this.logger.log("Configurações de envio de WhatsApp atualizadas.");
    return { success: true, config: this.config };
  }

  /**
   * Retorna o Pipeline completo de Onboarding com todos os lojistas em Trial
   */
  async getPipeline(): Promise<{ leads: OnboardingLead[]; summary: any }> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        isActive: true,
      },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const leads: OnboardingLead[] = [];

    const summary = {
      totalTrials: 0,
      stageD0: 0,
      stageD1: 0,
      stageD3: 0,
      stageD5: 0,
      stageD7: 0,
    };

    for (const t of tenants) {
      let settings: any = {};
      try {
        settings = typeof t.settings === "string" ? JSON.parse(t.settings) : t.settings || {};
      } catch {
        settings = {};
      }

      const subscriptionStatus = settings.subscription_status || "TRIAL";
      // Apenas lojas em Trial entram no pipeline de ativação
      if (subscriptionStatus !== "TRIAL") {
        continue;
      }

      summary.totalTrials++;

      const created = new Date(t.createdAt);
      const diffMs = now.getTime() - created.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let stage = OnboardingStage.D0_WELCOME;
      if (diffDays >= 7) {
        stage = OnboardingStage.D7_CONVERSION;
        summary.stageD7++;
      } else if (diffDays >= 5) {
        stage = OnboardingStage.D5_TRIAL_EXPIRING;
        summary.stageD5++;
      } else if (diffDays >= 3) {
        stage = OnboardingStage.D3_WHATSAPP_STATUS;
        summary.stageD3++;
      } else if (diffDays >= 1) {
        stage = OnboardingStage.D1_FIRST_OS;
        summary.stageD1++;
      } else {
        stage = OnboardingStage.D0_WELCOME;
        summary.stageD0++;
      }

      const owner = t.users[0];
      const ownerName = owner?.name || "Lojista";
      const plan = t.plan || "PRO";
      const asaasInvoiceUrl = settings.asaas_invoice_url || `https://torxos.com.br/super-admin/billing/${t.id}`;
      const trialEndsAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const suggestedMessage = this.formatMessage(stage, {
        nome: ownerName,
        empresa: t.tradeName,
        plano: plan,
        diasRestantes: Math.max(0, 7 - diffDays),
        linkAcesso: "https://torxos.com.br/login",
        linkFatura: asaasInvoiceUrl,
      });

      const cleanPhone = (t.phone || "").replace(/\D/g, "");
      const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      const whatsappDirectUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(suggestedMessage)}`;

      leads.push({
        id: t.id,
        tradeName: t.tradeName,
        ownerName,
        email: t.email,
        phone: t.phone,
        plan,
        daysSinceCreation: diffDays,
        currentStage: stage,
        currentStageLabel: this.stageTemplates[stage].label,
        suggestedMessage,
        whatsappDirectUrl,
        createdAt: t.createdAt.toISOString(),
        trialEndsAt,
        asaasInvoiceUrl: settings.asaas_invoice_url || null,
      });
    }

    return { leads, summary };
  }

  /**
   * Disparo imediato da mensagem de D0 (chamado no término de register())
   */
  async dispatchWelcomeD0(tenant: any, user: any) {
    this.logger.log(`Disparando boas-vindas D0 para novo tenant: ${tenant.tradeName} (${tenant.phone})`);

    const message = this.formatMessage(OnboardingStage.D0_WELCOME, {
      nome: user.name,
      empresa: tenant.tradeName,
      plano: tenant.plan,
      linkAcesso: "https://torxos.com.br/login",
      linkFatura: "https://torxos.com.br/lp",
    });

    // Se tiver webhook configurado, envia payload
    if (this.config.webhookUrl) {
      this.sendToWebhook({
        event: "ONBOARDING_D0_WELCOME",
        tenantId: tenant.id,
        phone: tenant.phone,
        email: tenant.email,
        ownerName: user.name,
        companyName: tenant.tradeName,
        plan: tenant.plan,
        message,
      }).catch((err) => {
        this.logger.warn(`Webhook D0 falhou: ${err.message}`);
      });
    }

    // Se tiver Evolution API configurada, dispara mensagem de WhatsApp direta
    if (this.config.apiUrl && this.config.apiKey) {
      this.sendViaEvolutionApi(tenant.phone, message).catch((err) => {
        this.logger.warn(`Evolution API D0 falhou: ${err.message}`);
      });
    }

    return { success: true, message: "Boas-vindas D0 processado com sucesso." };
  }

  /**
   * Dispara uma mensagem específica da régua sob demanda
   */
  async dispatchStageMessage(dto: DispatchOnboardingMessageDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      include: { users: { where: { role: "ADMIN" }, take: 1 } },
    });

    if (!tenant) {
      throw new Error("Empresa não encontrada.");
    }

    const owner = tenant.users[0];
    const ownerName = owner?.name || "Lojista";

    let settings: any = {};
    try {
      settings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings || {};
    } catch {
      settings = {};
    }

    const message =
      dto.customMessage ||
      this.formatMessage(dto.stage, {
        nome: ownerName,
        empresa: tenant.tradeName,
        plano: tenant.plan,
        linkAcesso: "https://torxos.com.br/login",
        linkFatura: settings.asaas_invoice_url || "https://torxos.com.br/lp",
      });

    let dispatchedWebhook = false;
    let dispatchedApi = false;

    if (this.config.webhookUrl) {
      await this.sendToWebhook({
        event: `ONBOARDING_${dto.stage}`,
        tenantId: tenant.id,
        phone: tenant.phone,
        email: tenant.email,
        ownerName,
        companyName: tenant.tradeName,
        plan: tenant.plan,
        stage: dto.stage,
        message,
      });
      dispatchedWebhook = true;
    }

    if (this.config.apiUrl && this.config.apiKey) {
      await this.sendViaEvolutionApi(tenant.phone, message);
      dispatchedApi = true;
    }

    const cleanPhone = (tenant.phone || "").replace(/\D/g, "");
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const whatsappDirectUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

    return {
      success: true,
      stage: dto.stage,
      dispatchedWebhook,
      dispatchedApi,
      whatsappDirectUrl,
      message,
    };
  }

  /**
   * Formata template substituindo variáveis dinâmicas
   */
  private formatMessage(stage: OnboardingStage, vars: Record<string, any>): string {
    const templateObj = this.stageTemplates[stage] || this.stageTemplates[OnboardingStage.D0_WELCOME];
    let text = templateObj.template;

    Object.entries(vars).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\{${key}\\}`, "g"), String(val || ""));
    });

    return text;
  }

  /**
   * Envia payload para Webhook externo (n8n/Make)
   */
  private async sendToWebhook(payload: any) {
    if (!this.config.webhookUrl) return;
    return fetch(this.config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Dispara WhatsApp via Evolution API / Z-API
   */
  private async sendViaEvolutionApi(phone: string, text: string) {
    if (!this.config.apiUrl || !this.config.apiKey) return;

    const cleanPhone = phone.replace(/\D/g, "");
    const number = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const url = `${this.config.apiUrl.replace(/\/$/, "")}/message/sendText/${this.config.instanceName}`;

    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.config.apiKey,
      },
      body: JSON.stringify({
        number,
        text,
      }),
    });
  }
}
