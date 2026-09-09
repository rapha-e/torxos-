import { Module } from "@nestjs/common";
import { ServiceOrdersService } from "./service-orders.service";
import { ServiceOrdersController } from "./service-orders.controller";
import { PublicOsController } from "./public-os.controller";

@Module({
  controllers: [ServiceOrdersController, PublicOsController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
