import { Controller, Post, Get, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { GrowthService } from "./growth.service";
import { GenerateAdsDto, GeneratePayloadDto } from "./dto/generate-ads.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/guards/roles.guard";
import { UserRole } from "../../common/enums";

@ApiTags("TorxOS Growth & Tráfego Pago")
@Controller("growth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class GrowthController {
  constructor(private growthService: GrowthService) {}

  @Get("presets")
  @ApiOperation({ summary: "Retorna o banco de personas, dores de bancada e ofertas para tráfego" })
  getPresets() {
    return this.growthService.getGrowthPresets();
  }

  @Post("generate-ads")
  @ApiOperation({ summary: "Gera copys de alta conversão para Meta Ads (Feed/Stories) e Google Search" })
  async generateAds(@Body() body: GenerateAdsDto) {
    return this.growthService.generateAds(body);
  }

  @Post("meta-payload")
  @ApiOperation({ summary: "Gera payload JSON estruturado pronto para a Meta Marketing API" })
  generateMetaPayload(
    @Body() body: { payloadConfig: GeneratePayloadDto; selectedAd: any },
  ) {
    return this.growthService.generateMetaMarketingPayload(
      body.payloadConfig,
      body.selectedAd,
    );
  }
}
