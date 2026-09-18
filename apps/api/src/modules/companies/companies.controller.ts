import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CompaniesService } from "./companies.service";
import { UpdateCompanySettingsDto } from "./dto/update-company-settings.dto";

@Controller("company")
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  getCurrent(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.companiesService.getCurrent(currentUser);
  }

  @Patch()
  updateCurrent(
    @Body() dto: UpdateCompanySettingsDto,
    @CurrentUser() currentUser: AuthenticatedUser
  ) {
    return this.companiesService.updateCurrent(dto, currentUser);
  }
}
