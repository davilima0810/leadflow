import { Injectable } from "@nestjs/common";
import type { Company, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type CompanyClient = Pick<PrismaService, "company"> | Prisma.TransactionClient;

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CompanyCreateInput, client: CompanyClient = this.prisma): Promise<Company> {
    return client.company.create({ data });
  }

  findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { id }
    });
  }

  findBySlug(slug: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { slug }
    });
  }
}
