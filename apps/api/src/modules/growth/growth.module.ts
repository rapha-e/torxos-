import { Module } from "@nestjs/common";
import { GrowthService } from "./growth.service";
import { GrowthController } from "./growth.controller";

@Module({
  controllers: [GrowthController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
