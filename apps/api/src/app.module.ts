import "./config/env";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [HealthController]
})
export class AppModule {}
