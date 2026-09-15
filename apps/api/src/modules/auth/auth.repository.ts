import { Injectable } from "@nestjs/common";
import type { Company, Prisma, User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CompanyRepository } from "../companies/company.repository";
import { UserRepository } from "../users/user.repository";

type CreateCompanyAndAdminInput = {
  company: Prisma.CompanyCreateInput;
  user: Omit<Prisma.UserCreateInput, "company">;
};

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository
  ) {}

  createCompanyAndAdmin(
    input: CreateCompanyAndAdminInput
  ): Promise<{ company: Company; user: User }> {
    return this.prisma.$transaction(async (transaction) => {
      const company = await this.companyRepository.create(
        input.company,
        transaction
      );

      const user = await this.userRepository.create(
        {
          ...input.user,
          company: {
            connect: {
              id: company.id
            }
          }
        },
        transaction
      );

      return { company, user };
    });
  }
}
