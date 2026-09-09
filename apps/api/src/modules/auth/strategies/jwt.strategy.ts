import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../../prisma/prisma.service";

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "torxos_super_secret_jwt_key_2026_production_ready",
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Acesso negado: Usuário inativo.");
    }

    if (user.role !== "SUPER_ADMIN" && (!user.tenant || !user.tenant.isActive)) {
      throw new UnauthorizedException("Acesso negado: Empresa inativa.");
    }

    // Suporte dinâmico para comutação de Filial da mesma rede ou Impersonate
    let activeTenant = user.tenant;
    let activeTenantId = user.tenantId;

    if (payload.tenantId && user.tenant && payload.tenantId !== user.tenantId) {
      const targetTenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
      });

      if (targetTenant && targetTenant.isActive) {
        const userHqId = user.tenant.parentTenantId || user.tenant.id;
        const targetHqId = targetTenant.parentTenantId || targetTenant.id;

        if (user.role === "SUPER_ADMIN" || userHqId === targetHqId) {
          activeTenant = targetTenant;
          activeTenantId = targetTenant.id;
        }
      }
    }

    return {
      id: user.id,
      tenantId: activeTenantId,
      email: user.email,
      role: user.role,
      name: user.name,
      tenant: activeTenant,
    };
  }
}
