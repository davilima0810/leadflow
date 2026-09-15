import { Module } from "@nestjs/common";
import { PublicFlowRepository } from "./public-flow.repository";
import { PublicFlowsController } from "./public-flows.controller";
import { PublicFlowsService } from "./public-flows.service";

@Module({
  controllers: [PublicFlowsController],
  providers: [PublicFlowsService, PublicFlowRepository]
})
export class PublicFlowsModule {}
