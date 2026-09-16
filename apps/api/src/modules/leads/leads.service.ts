import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { LeadPresenterService } from "./lead-presenter.service";
import { LeadRepository } from "./lead.repository";

@Injectable()
export class LeadsService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly leadPresenter: LeadPresenterService
  ) {}

  async list(currentUser: AuthenticatedUser) {
    const leads = await this.leadRepository.findManyByCompanyId(
      currentUser.companyId
    );

    return leads.map((lead) => this.leadPresenter.toListItem(lead));
  }

  async get(id: string, currentUser: AuthenticatedUser) {
    const lead = await this.leadRepository.findByIdAndCompanyId(
      id,
      currentUser.companyId
    );

    if (!lead) {
      throw new NotFoundException("Lead não encontrado.");
    }

    return this.leadPresenter.toDetail(lead);
  }
}
