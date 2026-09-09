import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StockService } from "./stock.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/user.decorator";

@ApiTags("TorxOS Stock (Estoque & Ruptura)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("stock")
export class StockController {
  constructor(private stockService: StockService) {}

  @Get("products")
  @ApiOperation({ summary: "Catálogo de produtos com saldos e localização física" })
  async listProducts(@CurrentTenant() tenantId: string) {
    return this.stockService.listProducts(tenantId);
  }

  @Post("products")
  @ApiOperation({ summary: "Cadastro de nova peça no estoque de bancada" })
  async createProduct(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.stockService.createProduct(tenantId, data);
  }

  @Patch("products/:id")
  @ApiOperation({ summary: "Atualização dos dados ou saldo de uma peça no estoque" })
  async updateProduct(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    return this.stockService.updateProduct(tenantId, id, data);
  }

  @Delete("products/:id")
  @ApiOperation({ summary: "Remoção lógica de uma peça do catálogo de estoque" })
  async deleteProduct(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ) {
    return this.stockService.deleteProduct(tenantId, id);
  }

  @Get("predictions/stockouts")
  @ApiOperation({ summary: "Listagem de peças com criticidade CRITICAL e WARNING" })
  async getStockouts(@CurrentTenant() tenantId: string) {
    return this.stockService.getStockoutPredictions(tenantId);
  }

  @Post("predictions/recalculate")
  @ApiOperation({ summary: "Executa o Motor Preditivo de Ruptura e atualiza semáforos" })
  async recalculate(@CurrentTenant() tenantId: string) {
    return this.stockService.runInventoryForecasting(tenantId);
  }

  @Post("purchase-orders/auto-generate")
  @ApiOperation({ summary: "Criação de sugestão de pedido de compra baseado nas rupturas previstas" })
  async autoGeneratePurchaseOrder(@CurrentTenant() tenantId: string) {
    return this.stockService.autoGeneratePurchaseOrder(tenantId);
  }

  @Post("purchase-orders/receive")
  @ApiOperation({ summary: "Confirmação de recebimento de mercadoria, entrada em estoque e geração de contas a pagar" })
  async receivePurchaseOrder(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.stockService.receivePurchaseOrder(tenantId, body);
  }
}
