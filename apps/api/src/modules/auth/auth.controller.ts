import { Controller, Post, Get, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshTokenDto } from "./dto/login.dto";
import { SetupMasterDto } from "./dto/setup-master.dto";
import { Public } from "./guards/jwt-auth.guard";

@ApiTags("Autenticação & Acessos")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Get("setup-status")
  @ApiOperation({ summary: "Verifica se a plataforma já possui um Dono do Software configurado" })
  @ApiResponse({ status: 200, description: "Status de inicialização retornado com sucesso" })
  async getSetupStatus() {
    return this.authService.getSetupStatus();
  }

  @Public()
  @Post("setup-master")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Configura o primeiro Dono do Software (Super Admin Global) independente de empresa" })
  @ApiResponse({ status: 201, description: "Super Admin criado e logado com sucesso" })
  @ApiResponse({ status: 403, description: "O sistema já possui Dono do Software configurado" })
  async setupMaster(@Body() dto: SetupMasterDto) {
    return this.authService.setupMaster(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Autenticação com e-mail/senha, retorna JWT com tenantId e role" })
  @ApiResponse({ status: 200, description: "Login efetuado com sucesso" })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotação de Access Token via Refresh Token" })
  @ApiResponse({ status: 200, description: "Token renovado com sucesso" })
  @ApiResponse({ status: 401, description: "Refresh token inválido" })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Auto-cadastro público de novas empresas (Onboarding com 7 dias de Trial)" })
  @ApiResponse({ status: 201, description: "Empresa criada e sessão iniciada com sucesso" })
  @ApiResponse({ status: 401, description: "CNPJ/CPF ou e-mail já existente" })
  async register(@Body() dto: import("./dto/register.dto").RegisterTenantDto) {
    return this.authService.register(dto);
  }
}
