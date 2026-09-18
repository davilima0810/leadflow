import { Module } from "@nestjs/common";
import { CompaniesController } from "./companies.controller";
import { CompanyRepository } from "./company.repository";
import { CompaniesService } from "./companies.service";

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, CompanyRepository]
})
export class CompaniesModule {}
