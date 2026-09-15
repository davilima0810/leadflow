import { Injectable } from "@nestjs/common";
import type { Company, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.prisma.company.create({ data });
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
