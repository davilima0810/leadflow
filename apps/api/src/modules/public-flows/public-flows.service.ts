import { Injectable, NotFoundException } from "@nestjs/common";
import { PublicFlowParamsDto } from "./dto/public-flow-params.dto";
import { PublicFlowRepository } from "./public-flow.repository";
import { toPublicFlowResponse } from "./public-flow-response.mapper";

@Injectable()
export class PublicFlowsService {
  constructor(private readonly publicFlowRepository: PublicFlowRepository) {}

  async getBySlugs(params: PublicFlowParamsDto) {
    const flow =
      await this.publicFlowRepository.findPublishedByCompanySlugAndFlowSlug(
        params.companySlug,
        params.flowSlug
      );

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toPublicFlowResponse(flow);
  }
}
