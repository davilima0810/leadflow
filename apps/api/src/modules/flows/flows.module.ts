import { Module } from "@nestjs/common";
import { QuestionRepository } from "../questions/question.repository";
import { FlowRepository } from "./flow.repository";
import { FlowsController } from "./flows.controller";
import { FlowsService } from "./flows.service";

@Module({
  controllers: [FlowsController],
  providers: [FlowsService, FlowRepository, QuestionRepository]
})
export class FlowsModule {}
