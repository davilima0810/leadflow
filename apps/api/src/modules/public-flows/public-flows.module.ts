import { LeadSubmissionRepository } from "./lead-submission.repository";
import { Module } from "@nestjs/common";
import { PublicFlowRepository } from "./public-flow.repository";
import { PublicFlowsController } from "./public-flows.controller";
import { PublicFlowsService } from "./public-flows.service";
import { SubmissionValidator } from "./submission-validator";

@Module({
  controllers: [PublicFlowsController],
  providers: [
    PublicFlowsService,
    PublicFlowRepository,
    LeadSubmissionRepository,
    SubmissionValidator
  ]
})
export class PublicFlowsModule {}
