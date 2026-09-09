import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SalesService } from "./sales.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/user.decorator";

@ApiTags("TorxOS Sales & PDV (Frente de Caixa & Balcão)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("sales")
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: "Registrar nova venda de balcão (Acessórios, Celulares ou Eletrônicos)" })
  async createSale(@CurrentTenant() tenantId: string, @Body() dto: CreateSaleDto) {
    return this.salesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Listagem do histórico de vendas de balcão" })
  @ApiQuery({ name: "search", required: false, description: "Busca por cliente, produto, imei ou notas" })
  @ApiQuery({ name: "startDate", required: false, description: "Data inicial (AAAA-MM-DD)" })
  @ApiQuery({ name: "endDate", required: false, description: "Data final (AAAA-MM-DD)" })
  @ApiQuery({ name: "paymentMethod", required: false, description: "Forma de pagamento" })
  async listSales(
    @CurrentTenant() tenantId: string,
    @Query("search") search?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("paymentMethod") paymentMethod?: string,
  ) {
    return this.salesService.list(tenantId, search, startDate, endDate, paymentMethod);
  }

  @Get("daily-summary")
  @ApiOperation({ summary: "Resumo executivo de fechamento diário do PDV de balcão" })
  async getDailySummary(@CurrentTenant() tenantId: string) {
    return this.salesService.getDailySummary(tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar detalhes de uma venda por ID (para reimpressão de comprovante)" })
  async getSaleById(@CurrentTenant() tenantId: string, @Param("id") id: string) {
    return this.salesService.findById(tenantId, id);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancelar venda com estorno automático de estoque e transações financeiras" })
  async cancelSale(@CurrentTenant() tenantId: string, @Param("id") id: string) {
    return this.salesService.cancel(tenantId, id);
  }
}
