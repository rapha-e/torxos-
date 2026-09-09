import { Module } from "@nestjs/common";
import { AiMentorService } from "./ai-mentor.service";
import { AiMentorController } from "./ai-mentor.controller";

@Module({
  controllers: [AiMentorController],
  providers: [AiMentorService],
  exports: [AiMentorService],
})
export class AiMentorModule {}
