import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CreatePublicFlowSubmissionDto } from "./dto/create-public-flow-submission.dto";
import { PublicFlowParamsDto } from "./dto/public-flow-params.dto";
import { PublicSubmissionRateLimitGuard } from "./public-submission-rate-limit.guard";
import { PublicFlowsService } from "./public-flows.service";

@Controller("public-flows")
export class PublicFlowsController {
  constructor(private readonly publicFlowsService: PublicFlowsService) {}

  @Get(":companySlug/:flowSlug")
  getBySlugs(@Param() params: PublicFlowParamsDto) {
    return this.publicFlowsService.getBySlugs(params);
  }

  @Post(":companySlug/:flowSlug/submissions")
  @UseGuards(PublicSubmissionRateLimitGuard)
  submit(
    @Param() params: PublicFlowParamsDto,
    @Body() dto: CreatePublicFlowSubmissionDto
  ) {
    return this.publicFlowsService.submit(params, dto);
  }
}
