import { LeadSubmissionRepository } from "./lead-submission.repository";
import { Module } from "@nestjs/common";
import { LeadPresenterService } from "../leads/lead-presenter.service";
import { PublicFlowRepository } from "./public-flow.repository";
import { PublicFlowsController } from "./public-flows.controller";
import { PublicFlowsService } from "./public-flows.service";
import { PublicSubmissionRateLimitGuard } from "./public-submission-rate-limit.guard";
import { SubmissionValidator } from "./submission-validator";

@Module({
  controllers: [PublicFlowsController],
  providers: [
    PublicFlowsService,
    PublicFlowRepository,
    LeadSubmissionRepository,
    PublicSubmissionRateLimitGuard,
    SubmissionValidator,
    LeadPresenterService
  ]
})
export class PublicFlowsModule {}
