import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TenantService } from "./tenant.service";
import { UpdateTenantSettingsDto, CreateTeamUserDto } from "./dto/tenant-settings.dto";
import { CreateBranchDto } from "./dto/branch.dto";
import { CancelSubscriptionDto } from "./dto/cancel-subscription.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant, CurrentUser } from "../../common/decorators/user.decorator";
import { Roles } from "../../common/guards/roles.guard";
import { PlanFeatureGuard, RequireFeature } from "../../common/guards/plan-feature.guard";
import { UserRole } from "../../common/enums";

@ApiTags("TorxOS Tenant & Configurações (Empresa & Equipe)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tenant")
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get("settings")
  @ApiOperation({ summary: "Consulta os dados da empresa, regras de negócio e termos de garantia" })
  async getSettings(@CurrentTenant() tenantId: string) {
    return this.tenantService.getSettings(tenantId);
  }

  @Patch("settings")
  @ApiOperation({ summary: "Atualiza os dados da assistência, prazo de garantia e regras de automação" })
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.tenantService.updateSettings(tenantId, dto);
  }

  @Post("subscription/cancel")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Cancela a assinatura do plano SaaS com agendamento até o fim do ciclo pago e coleta de feedback" })
  async cancelSubscription(
    @CurrentTenant() tenantId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.tenantService.cancelSubscription(tenantId, dto);
  }

  @Post("subscription/reactivate")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Reativa uma assinatura que estava agendada para cancelamento" })
  async reactivateSubscription(@CurrentTenant() tenantId: string) {
    return this.tenantService.reactivateSubscription(tenantId);
  }

  @Get("users")
  @ApiOperation({ summary: "Listagem da equipe com cargos e percentuais de comissão" })
  async listUsers(@CurrentTenant() tenantId: string) {
    return this.tenantService.listUsers(tenantId);
  }

  @Post("users")
  @ApiOperation({ summary: "Cadastra novo colaborador ou técnico com regras de comissão" })
  async createTeamUser(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateTeamUserDto,
  ) {
    return this.tenantService.createTeamUser(tenantId, dto);
  }

  @Patch("users/:id")
  @ApiOperation({ summary: "Atualiza comissões ou status de atividade de um membro da equipe" })
  async updateUser(
    @CurrentTenant() tenantId: string,
    @Param("id") userId: string,
    @Body() body: any,
  ) {
    return this.tenantService.updateUser(tenantId, userId, body);
  }

  @Delete("users/:id")
  @ApiOperation({ summary: "Exclui ou inativa um colaborador da equipe da loja" })
  async deleteUser(
    @CurrentTenant() tenantId: string,
    @Param("id") userId: string,
  ) {
    return this.tenantService.deleteUser(tenantId, userId);
  }

  @Post("users/:id/reset-password")
  @ApiOperation({ summary: "Redefine a senha de acesso de um colaborador da equipe" })
  async resetUserPassword(
    @CurrentTenant() tenantId: string,
    @Param("id") userId: string,
    @Body() body: { newPassword?: string },
  ) {
    return this.tenantService.resetUserPassword(tenantId, userId, body?.newPassword);
  }

  // =========================================================================
  // GESTÃO MULTI-FILIAIS & MATRIZ (PLANO ENTERPRISE & MASTER)
  // =========================================================================

  @Get("branches")
  @ApiOperation({ summary: "Lista todas as unidades e filiais vinculadas à rede da empresa" })
  async getBranches(@CurrentTenant() tenantId: string) {
    return this.tenantService.getBranches(tenantId);
  }

  @Post("branches")
  @UseGuards(PlanFeatureGuard)
  @RequireFeature("canUseMultiBranches")
  @ApiOperation({ summary: "Cadastra nova filial vinculada à matriz (Exclusivo Enterprise)" })
  async createBranch(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.tenantService.createBranch(tenantId, dto);
  }

  @Post("branches/:id/switch")
  @ApiOperation({ summary: "Gera token de acesso rápido para operar na filial selecionada" })
  async switchBranch(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Param("id") targetBranchId: string,
  ) {
    return this.tenantService.switchBranch(tenantId, userId, targetBranchId);
  }

  // =========================================================================
  // ROTAS EXCLUSIVAS DO DONO DO SOFTWARE (SUPER ADMIN)
  // =========================================================================

  @Get("super-admin/dashboard")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Visão 360 do Dono do Software: todas as empresas cadastradas, MRR e métricas globais" })
  async getSuperAdminDashboard() {
    return this.tenantService.getSuperAdminDashboard();
  }

  @Patch("super-admin/tenants/:id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Permite ao Super Admin trocar o plano de qualquer empresa ou ativar/suspender" })
  async updateTenantBySuperAdmin(
    @Param("id") tenantId: string,
    @Body() body: any,
  ) {
    return this.tenantService.updateTenantBySuperAdmin(tenantId, body);
  }

  @Post("super-admin/tenants/:id/reset-admin-password")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Redefine a senha de acesso do administrador da assistência técnica" })
  async resetTenantAdminPassword(
    @Param("id") tenantId: string,
    @Body() body: { newPassword?: string },
  ) {
    return this.tenantService.resetTenantAdminPassword(tenantId, body?.newPassword);
  }

  @Post("super-admin/tenants/:id/impersonate")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Permite ao Super Admin entrar no ambiente da loja em Modo Suporte (Impersonate)" })
  async impersonateTenant(@Param("id") tenantId: string) {
    return this.tenantService.impersonateTenant(tenantId);
  }

  @Post("super-admin/tenants/:id/confirm-payment")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Confirma o pagamento da fatura da empresa, renovando por +30 dias" })
  async confirmTenantPayment(@Param("id") tenantId: string) {
    return this.tenantService.confirmTenantPayment(tenantId);
  }

  @Post("super-admin/tenants/:id/extend-grace")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Estende o prazo de confiança da empresa (ex: +3 ou +5 dias)" })
  async extendTenantGracePeriod(
    @Param("id") tenantId: string,
    @Body() body: { days?: number },
  ) {
    return this.tenantService.extendTenantGracePeriod(tenantId, body?.days || 5);
  }

  @Post("super-admin/tenants/:id/send-billing-email")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Dispara e-mail oficial com fatura e dados de pagamento para a empresa" })
  async sendBillingEmail(@Param("id") tenantId: string) {
    return this.tenantService.sendBillingEmail(tenantId);
  }

  @Delete("super-admin/tenants/:id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Exclui permanentemente uma assistência técnica e todos os seus registros" })
  async deleteTenantBySuperAdmin(@Param("id") tenantId: string) {
    return this.tenantService.deleteTenantBySuperAdmin(tenantId);
  }
}

