import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type UserClient = Pick<PrismaService, "user"> | Prisma.TransactionClient;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput, client: UserClient = this.prisma): Promise<User> {
    return client.user.create({ data });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  findByIdAndCompanyId(id: string, companyId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        companyId
      }
    });
  }

  findByIdAndCompanyIdWithCompany(
    id: string,
    companyId: string
  ): Promise<(User & { company: { id: string; name: string; slug: string } }) | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
  }

  findByEmailWithCompany(
    email: string
  ): Promise<(User & { company: { id: string; name: string; slug: string } }) | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
  }
}
