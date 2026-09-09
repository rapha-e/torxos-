import { Controller, Get, Post, Body, Param, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ServiceOrdersService } from "./service-orders.service";
import { ClientApproveDto } from "./dto/service-order.dto";
import { Public } from "../auth/guards/jwt-auth.guard";

@ApiTags("Portal Público do Cliente (Sem Login)")
@Controller("public/os")
export class PublicOsController {
  constructor(private serviceOrdersService: ServiceOrdersService) {}

  @Public()
  @Get(":publicToken")
  @ApiOperation({ summary: "Consulta pública do laudo e orçamento pelo cliente via WhatsApp / QR Code" })
  @ApiResponse({ status: 200, description: "Dados da OS recuperados com sucesso" })
  async getPublicOrder(@Param("publicToken") publicToken: string) {
    return this.serviceOrdersService.findByPublicToken(publicToken);
  }

  @Public()
  @Post(":publicToken/approve")
  @ApiOperation({ summary: "Aprovação formal do orçamento pelo cliente com geolocalização e assinatura" })
  @ApiResponse({ status: 200, description: "Orçamento aprovado pelo cliente" })
  async approveOrder(
    @Param("publicToken") publicToken: string,
    @Body() dto: ClientApproveDto,
    @Req() req: any,
  ) {
    const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
    return this.serviceOrdersService.clientApprove(publicToken, {
      ...dto,
      clientIp: dto.clientIp || (typeof clientIp === "string" ? clientIp : undefined),
    });
  }
}
