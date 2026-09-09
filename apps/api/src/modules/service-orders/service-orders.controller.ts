import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ServiceOrdersService } from "./service-orders.service";
import { CreateServiceOrderDto, UpdateOsStatusDto } from "./dto/service-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/user.decorator";
import { OsStatus } from "../../common/enums";

@ApiTags("TorxOS OS (Ordens de Serviço)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("service-orders")
export class ServiceOrdersController {
  constructor(private serviceOrdersService: ServiceOrdersService) {}

  @Get()
  @ApiOperation({ summary: "Listagem de Ordens de Serviço com filtros de status, busca e período" })
  @ApiQuery({ name: "status", required: false, enum: OsStatus })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  async list(
    @CurrentTenant() tenantId: string,
    @Query("status") status?: OsStatus,
    @Query("search") search?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.serviceOrdersService.list(tenantId, status, search, startDate, endDate);
  }

  @Get("kanban")
  @ApiOperation({ summary: "Agrupamento de Ordens de Serviço por colunas de status para Kanban de bancada" })
  async getKanban(@CurrentTenant() tenantId: string) {
    return this.serviceOrdersService.getKanban(tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Consulta detalhada de uma Ordem de Serviço pelo ID" })
  async findById(@CurrentTenant() tenantId: string, @Param("id") id: string) {
    return this.serviceOrdersService.findById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: "Abertura de nova Ordem de Serviço com checklist e itens orçados" })
  async create(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceOrderDto) {
    return this.serviceOrdersService.create(tenantId, dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Transição de status da OS (dispara triggers de baixa de estoque e financeiro)" })
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() dto: UpdateOsStatusDto,
  ) {
    return this.serviceOrdersService.updateStatus(tenantId, id, dto);
  }
}
