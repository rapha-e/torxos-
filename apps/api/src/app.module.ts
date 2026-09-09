import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ServiceOrdersModule } from "./modules/service-orders/service-orders.module";
import { StockModule } from "./modules/stock/stock.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { AiMentorModule } from "./modules/ai-mentor/ai-mentor.module";
import { SalesModule } from "./modules/sales/sales.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { AsaasModule } from "./modules/asaas/asaas.module";
import { GrowthModule } from "./modules/growth/growth.module";
import { SocialModule } from "./modules/social/social.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    TenantModule,
    ServiceOrdersModule,
    StockModule,
    SalesModule,
    FinanceModule,
    AiMentorModule,
    AsaasModule,
    GrowthModule,
    SocialModule,
    OnboardingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
