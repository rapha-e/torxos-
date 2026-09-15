import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  }
);

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const explicitTenant = request.headers["x-tenant-id"];
    // Se o usuário for SUPER_ADMIN e especificar um x-tenant-id, opera naquele tenant
    if (request.user?.role === "SUPER_ADMIN" && explicitTenant) {
      return String(explicitTenant).trim();
    }
    return request.user?.tenantId ? String(request.user.tenantId).trim() : (explicitTenant ? String(explicitTenant).trim() : "");
  }
);
