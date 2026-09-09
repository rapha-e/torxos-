import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ClientsService } from "./clients.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/user.decorator";

@ApiTags("Clientes & Contatos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("clients")
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: "Listagem de clientes com busca por nome, telefone ou CPF" })
  @ApiQuery({ name: "search", required: false })
  async list(@CurrentTenant() tenantId: string, @Query("search") search?: string) {
    return this.clientsService.list(tenantId, search);
  }

  @Post()
  @ApiOperation({ summary: "Cadastro rápido de cliente no balcão" })
  async create(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.clientsService.create(tenantId, data);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhes do cliente com histórico de Ordens de Serviço" })
  async findById(@CurrentTenant() tenantId: string, @Param("id") id: string) {
    return this.clientsService.findById(tenantId, id);
  }
}
