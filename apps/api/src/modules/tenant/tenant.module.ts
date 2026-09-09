import { Module, forwardRef } from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { TenantController } from "./tenant.controller";
import { AuthModule } from "../auth/auth.module";
import { AsaasModule } from "../asaas/asaas.module";

@Module({
  imports: [AuthModule, forwardRef(() => AsaasModule)],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
