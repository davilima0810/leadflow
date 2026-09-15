import { Controller, Get, Param } from "@nestjs/common";
import { PublicFlowParamsDto } from "./dto/public-flow-params.dto";
import { PublicFlowsService } from "./public-flows.service";

@Controller("public-flows")
export class PublicFlowsController {
  constructor(private readonly publicFlowsService: PublicFlowsService) {}

  @Get(":companySlug/:flowSlug")
  getBySlugs(@Param() params: PublicFlowParamsDto) {
    return this.publicFlowsService.getBySlugs(params);
  }
}
