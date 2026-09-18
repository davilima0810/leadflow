import "./config/env";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { CompaniesModule } from "./modules/companies/companies.module";
import { FlowsModule } from "./modules/flows/flows.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { PublicFlowsModule } from "./modules/public-flows/public-flows.module";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CompaniesModule,
    FlowsModule,
    PublicFlowsModule,
    LeadsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
