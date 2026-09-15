import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard, Public } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../../common/guards/roles.guard";
import { UserRole } from "../../common/enums";
import { OnboardingService } from "./onboarding.service";
import {
  DispatchOnboardingMessageDto,
  UpdateOnboardingConfigDto,
} from "./dto/onboarding.dto";

@ApiTags("Onboarding & CRM WhatsApp (Ativação de Lojistas)")
@Controller("onboarding")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get("pipeline")
  @ApiOperation({
    summary: "Retorna todas as empresas em Trial categorizadas por estágio da régua (D0 a D7)",
  })
  @ApiResponse({ status: 200, description: "Pipeline retornado com sucesso." })
  getPipeline() {
    return this.onboardingService.getPipeline();
  }

  @Get("config")
  @ApiOperation({
    summary: "Consulta configurações de envio de WhatsApp (Evolution API / Webhook)",
  })
  getConfig() {
    return this.onboardingService.getConfig();
  }

  @Post("config")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Atualiza as configurações de webhook ou Evolution API",
  })
  updateConfig(@Body() dto: UpdateOnboardingConfigDto) {
    return this.onboardingService.updateConfig(dto);
  }

  @Post("dispatch")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Dispara manualmente a mensagem de um estágio da régua para o lojista",
  })
  @ApiResponse({ status: 200, description: "Mensagem disparada com sucesso." })
  dispatchStageMessage(@Body() dto: DispatchOnboardingMessageDto) {
    return this.onboardingService.dispatchStageMessage(dto);
  }

  @Post("trigger-cycle")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Executa imediatamente o ciclo de envio automático da régua de onboarding para todos os lojistas em Trial",
  })
  @ApiResponse({ status: 200, description: "Ciclo de automação executado com sucesso." })
  triggerCycle() {
    return this.onboardingService.triggerAutomationCycle();
  }

  @Public()
  @Get("whatsapp/connect")
  @ApiOperation({ summary: "Consulta status de conexão e obtém QR Code em JSON" })
  getWhatsAppConnect() {
    return this.onboardingService.getWhatsAppConnectInfo();
  }

  @Public()
  @Get("whatsapp/qrcode")
  @ApiOperation({ summary: "Exibe página visual com QR Code para pareamento rápido do WhatsApp" })
  async getWhatsAppQrPage(@Res() res: any) {
    const info = await this.onboardingService.getWhatsAppConnectInfo();

    let contentHtml = "";
    if (info.connected) {
      contentHtml = `
        <div style="background:#D1E7DD; border:1px solid #A3CFBB; color:#0F5132; padding:24px; border-radius:16px; margin-bottom:20px;">
          <div style="font-size:36px; margin-bottom:8px;">🎉</div>
          <h2 style="margin:0 0 8px 0; font-size:20px;">WhatsApp Conectado com Sucesso!</h2>
          <p style="margin:0; font-size:14px;">A instância <strong>${info.instanceName}</strong> está ativa e pronta para disparar notificações da bancada e da régua de onboarding de forma 100% automática.</p>
        </div>
      `;
    } else if (info.base64) {
      contentHtml = `
        <div style="background:white; border:1px solid #E5E5E0; padding:24px; border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.06); margin-bottom:20px;">
          <img src="${info.base64}" alt="QR Code WhatsApp" style="width:280px; height:280px; border-radius:12px; margin:0 auto 16px; display:block; border:1px solid #f0f0ed;" />
          <div style="background:#FFF3CD; border:1px solid #FFE69C; color:#664D03; padding:10px 14px; border-radius:10px; font-size:13px; font-weight:600; display:inline-block;">
            ⏳ Atualiza sozinho a cada 15s se expirar
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="background:#F8D7DA; border:1px solid #F1AEB5; color:#842029; padding:20px; border-radius:16px; margin-bottom:20px;">
          <h3 style="margin:0 0 6px 0;">Inicializando instância WhatsApp...</h3>
          <p style="margin:0; font-size:13px;">Aguarde alguns instantes e atualize a página.</p>
        </div>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conectar WhatsApp — TorxOS</title>
  ${!info.connected ? '<meta http-equiv="refresh" content="15">' : ""}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F4F4F0;
      color: #1C1C1A;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: white;
      max-width: 480px;
      width: 100%;
      border-radius: 24px;
      padding: 32px 24px;
      text-align: center;
      border: 1px solid rgba(28,25,23,0.1);
      box-shadow: 0 15px 35px rgba(0,0,0,0.05);
    }
    .badge {
      display: inline-block;
      background: #181816;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    h1 { font-size: 22px; margin: 0 0 6px; font-weight: 800; color: #181816; }
    p.desc { font-size: 13px; color: #71716C; margin: 0 0 24px; line-height: 1.5; }
    .steps {
      text-align: left;
      background: #FAF9F6;
      border: 1px solid #EBEBE8;
      border-radius: 16px;
      padding: 16px;
      margin-top: 20px;
      font-size: 13px;
    }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 6px; color: #444; }
    .steps strong { color: #181816; }
    .btn {
      display: inline-block;
      background: #181816;
      color: white;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 12px;
      margin-top: 16px;
      transition: all 0.2s;
    }
    .btn:hover { background: #333; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Gateway Evolution API</div>
    <h1>Conectar WhatsApp do Sistema</h1>
    <p class="desc">Conecte o número de suporte ou da assistência para envio 100% automático de mensagens da bancada e onboarding.</p>

    ${contentHtml}

    <div class="steps">
      <div style="font-weight:700; margin-bottom:8px; color:#181816;">📱 Como conectar pelo celular:</div>
      <ol>
        <li>Abra o <strong>WhatsApp</strong> no seu smartphone.</li>
        <li>Toque em <strong>Configurações</strong> (ou 3 pontinhos) ➔ <strong>Aparelhos Conectados</strong>.</li>
        <li>Toque em <strong>Conectar um aparelho</strong> e aponte a câmera para o QR Code acima.</li>
      </ol>
    </div>

    <a href="/api/v1/onboarding/whatsapp/qrcode" class="btn">🔄 Atualizar QR Code Agora</a>
  </div>
</body>
</html>`;

    res.header("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  }

  @Public()
  @Post("whatsapp/test-send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Dispara mensagem teste via Evolution API" })
  async testSendWhatsApp(@Body() body: { phone: string; text?: string }) {
    const res = await this.onboardingService.testDirectMessage(body.phone, body.text);
    return {
      success: true,
      phone: body.phone,
      response: res ? await res.json().catch(() => ({})) : null,
    };
  }
}
