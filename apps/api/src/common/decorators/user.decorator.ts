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
    return request.user?.tenantId || request.headers["x-tenant-id"];
  }
);
