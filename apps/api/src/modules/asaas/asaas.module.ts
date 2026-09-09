import { Module, forwardRef } from "@nestjs/common";
import { AsaasService } from "./asaas.service";
import { AsaasController } from "./asaas.controller";
import { TenantModule } from "../tenant/tenant.module";

@Module({
  imports: [forwardRef(() => TenantModule)],
  controllers: [AsaasController],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class AsaasModule {}

