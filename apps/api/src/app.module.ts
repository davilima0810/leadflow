import "./config/env";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { FlowsModule } from "./modules/flows/flows.module";
import { PublicFlowsModule } from "./modules/public-flows/public-flows.module";

@Module({
  imports: [DatabaseModule, AuthModule, FlowsModule, PublicFlowsModule],
  controllers: [HealthController]
})
export class AppModule {}
