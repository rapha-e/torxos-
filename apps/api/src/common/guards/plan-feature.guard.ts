import {
  SetMetadata,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { isPlanFeatureAllowed, PlanLimits } from "../plan-rules";

export const PLAN_FEATURE_KEY = "plan_feature";
export type FeatureKey = keyof Omit<PlanLimits, "name" | "priceMonth" | "maxUsers">;

/**
 * Decorator para proteger rotas por funcionalidade do plano contratado
 * Exemplo: @RequireFeature("canUseAiMentor")
 */
export const RequireFeature = (feature: FeatureKey) =>
  SetMetadata(PLAN_FEATURE_KEY, feature);

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<FeatureKey>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Se nenhuma feature foi exigida para a rota, permite o acesso
    if (!requiredFeature) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException({
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      });
    }

    // Super Admin tem acesso irrestrito a todos os recursos
    if (user.role === "SUPER_ADMIN") {
      return true;
    }

    // Obter o plano do tenant do usuário
    const planName = user.tenant?.plan || "PRO";

    const allowed = isPlanFeatureAllowed(planName, requiredFeature);
    if (!allowed) {
      throw new ForbiddenException({
        code: "PLAN_UPGRADE_REQUIRED",
        feature: requiredFeature,
        currentPlan: planName,
        message: `Esta funcionalidade não está disponível no plano ${planName}. Faça upgrade para acessar.`,
      });
    }

    return true;
  }
}
