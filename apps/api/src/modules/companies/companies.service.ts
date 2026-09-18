import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CompanyRepository } from "./company.repository";
import { toCompanyResponse } from "./company-response.mapper";
import { UpdateCompanySettingsDto } from "./dto/update-company-settings.dto";

@Injectable()
export class CompaniesService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async getCurrent(currentUser: AuthenticatedUser) {
    const company = await this.companyRepository.findById(currentUser.companyId);

    if (!company) {
      throw new NotFoundException("Empresa não encontrada.");
    }

    return toCompanyResponse(company);
  }

  async updateCurrent(
    dto: UpdateCompanySettingsDto,
    currentUser: AuthenticatedUser
  ) {
    const company = await this.companyRepository.updateById(currentUser.companyId, {
      whatsappPhone: dto.whatsappPhone?.trim() || null
    });

    return toCompanyResponse(company);
  }
}
