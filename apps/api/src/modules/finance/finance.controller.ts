import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { FinanceService } from "./finance.service";
import { CreateTransactionDto, SettleTransactionDto } from "./dto/finance.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/user.decorator";
import { TransactionType, TransactionStatus } from "../../common/enums";

@ApiTags("TorxOS Finance (Financeiro & ERP)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("finance")
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get("transactions")
  @ApiOperation({ summary: "Consulta de títulos a pagar e a receber com filtros de data e status" })
  @ApiQuery({ name: "type", required: false, enum: TransactionType })
  @ApiQuery({ name: "status", required: false, enum: TransactionStatus })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async listTransactions(
    @CurrentTenant() tenantId: string,
    @Query("type") type?: TransactionType,
    @Query("status") status?: TransactionStatus,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.financeService.listTransactions(tenantId, type, status, startDate, endDate);
  }

  @Post("transactions")
  @ApiOperation({ summary: "Lançamento manual de despesas ou receitas avulsas" })
  async createTransaction(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.financeService.createTransaction(tenantId, dto);
  }

  @Post("transactions/:id/settle")
  @ApiOperation({ summary: "Quitação de título com especificação de conta bancária de liquidação" })
  async settleTransaction(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() dto: SettleTransactionDto,
  ) {
    return this.financeService.settleTransaction(tenantId, id, dto);
  }

  @Get("reports/dre")
  @ApiOperation({ summary: "Relatório DRE em tempo real parametrizado por período" })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async getDre(
    @CurrentTenant() tenantId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.financeService.getDreReport(tenantId, startDate, endDate);
  }

  @Get("reports/cash-flow")
  @ApiOperation({ summary: "Extrato de fluxo de caixa realizado e projetado para 30/60/90 dias" })
  async getCashFlow(@CurrentTenant() tenantId: string) {
    return this.financeService.getCashFlowProjection(tenantId);
  }

  @Post("reconciliation/parse")
  @ApiOperation({ summary: "Parsing inteligente de extrato bancário OFX com identificação de matches" })
  async parseOfx(
    @CurrentTenant() tenantId: string,
    @Body() body: { ofxContent: string },
  ) {
    return this.financeService.parseAndMatchOfx(tenantId, body.ofxContent);
  }

  @Post("reconciliation/confirm")
  @ApiOperation({ summary: "Confirmação e liquidação em lote dos lançamentos conciliados" })
  async confirmReconciliation(
    @CurrentTenant() tenantId: string,
    @Body() body: { items: any[] },
  ) {
    return this.financeService.confirmReconciliation(tenantId, body.items);
  }

  @Post("pix/generate")
  @ApiOperation({ summary: "Geração de QR Code e Payload PIX BR Code dinâmico do Banco Central" })
  async generatePix(
    @CurrentTenant() tenantId: string,
    @Body() body: { amount: number; description?: string; orderNumber?: string; pixKey?: string },
  ) {
    return this.financeService.generatePixCharge(tenantId, body);
  }

  @Post("pix/webhook-simulate")
  @ApiOperation({ summary: "Simulação de webhook Open Finance de confirmação instantânea de PIX pago" })
  async simulatePixWebhook(
    @CurrentTenant() tenantId: string,
    @Body() body: { txId: string; amount: number; transactionId?: string; bankAccountId?: string },
  ) {
    return this.financeService.simulatePixWebhook(tenantId, body);
  }

  // --- CONTAS BANCÁRIAS E CAIXAS ---

  @Get("bank-accounts")
  @ApiOperation({ summary: "Listagem de todas as contas bancárias e caixas da loja" })
  async listBankAccounts(@CurrentTenant() tenantId: string) {
    return this.financeService.listBankAccounts(tenantId);
  }

  @Post("bank-accounts")
  @ApiOperation({ summary: "Cadastro de novo banco ou ponto de caixa" })
  async createBankAccount(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; accountType: string; initialBalance?: number; currentBalance?: number },
  ) {
    return this.financeService.createBankAccount(tenantId, body);
  }

  @Patch("bank-accounts/:id")
  @ApiOperation({ summary: "Atualização de dados ou saldo de uma conta bancária" })
  async updateBankAccount(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: { name?: string; accountType?: string; currentBalance?: number; isActive?: boolean },
  ) {
    return this.financeService.updateBankAccount(tenantId, id, body);
  }

  @Delete("bank-accounts/:id")
  @ApiOperation({ summary: "Inativação de conta bancária" })
  async deleteBankAccount(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ) {
    return this.financeService.deleteBankAccount(tenantId, id);
  }
}
