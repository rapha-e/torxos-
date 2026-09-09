import { Controller, Post, Get, Param, Body, Headers, UseGuards, HttpCode, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AsaasService } from "./asaas.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/guards/roles.guard";
import { UserRole } from "../../common/enums";

@ApiTags("TorxOS Asaas (Cobrança & Pagamentos)")
@Controller("asaas")
export class AsaasController {
  constructor(private asaasService: AsaasService) {}

  // =========================================================================
  // WEBHOOK PÚBLICO — Recebe notificações de pagamento do Asaas
  // =========================================================================

  @Public()
  @Post("webhook")
  @HttpCode(200)
  @ApiOperation({ summary: "Webhook público do Asaas para confirmação automática de pagamentos" })
  async handleWebhook(
    @Body() body: any,
    @Headers("asaas-access-token") accessToken: string,
  ) {
    // Validação do token do webhook
    const headerToken = accessToken || body?.token;
    if (!this.asaasService.validateWebhookToken(headerToken)) {
      throw new BadRequestException("Token de webhook inválido.");
    }

    return this.asaasService.processWebhookEvent(body);
  }

  // =========================================================================
  // ROTAS PROTEGIDAS — SUPER ADMIN ONLY
  // =========================================================================

  @Post("tenants/:id/create-customer")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cadastra ou atualiza o Tenant como cliente no Asaas" })
  async createCustomer(@Param("id") tenantId: string) {
    return this.asaasService.createOrUpdateCustomer(tenantId);
  }

  @Post("tenants/:id/create-subscription")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cria assinatura mensal recorrente no Asaas para a empresa" })
  async createSubscription(
    @Param("id") tenantId: string,
    @Body() body: { billingType?: string },
  ) {
    return this.asaasService.createSubscription(tenantId, body?.billingType || "UNDEFINED");
  }

  @Post("tenants/:id/create-charge")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Gera cobrança avulsa (Pix/Boleto/Cartão) para a empresa" })
  async createCharge(
    @Param("id") tenantId: string,
    @Body() body: { billingType?: string },
  ) {
    return this.asaasService.createCharge(tenantId, body?.billingType || "UNDEFINED");
  }

  @Get("tenants/:id/payment-status")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Consulta o status da última cobrança da empresa no Asaas" })
  async getPaymentStatus(@Param("id") tenantId: string) {
    return this.asaasService.getPaymentStatus(tenantId);
  }

  @Get("tenants/:id/pix-qrcode")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retorna o QR Code Pix da cobrança ativa da empresa" })
  async getPixQrCode(@Param("id") tenantId: string) {
    return this.asaasService.getPixQrCode(tenantId);
  }

  @Get("tenants/:id/subscription")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Consulta informações da assinatura recorrente da empresa" })
  async getSubscription(@Param("id") tenantId: string) {
    return this.asaasService.getSubscriptionInfo(tenantId);
  }
}
