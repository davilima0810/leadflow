import { Injectable } from "@nestjs/common";
import type { Flow, Prisma, Question, QuestionOption } from "@prisma/client";
import { FlowStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type FlowWithQuestions = Flow & {
  questions: Array<Question & { options: QuestionOption[] }>;
};

@Injectable()
export class FlowRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.FlowUncheckedCreateInput): Promise<Flow> {
    return this.prisma.flow.create({ data });
  }

  findManyByCompanyId(companyId: string): Promise<Flow[]> {
    return this.prisma.flow.findMany({
      where: {
        companyId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  findByIdAndCompanyId(
    id: string,
    companyId: string
  ): Promise<FlowWithQuestions | null> {
    return this.prisma.flow.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        questions: {
          orderBy: {
            position: "asc"
          },
          include: {
            options: {
              orderBy: {
                position: "asc"
              }
            }
          }
        }
      }
    });
  }

  findByCompanyIdAndSlug(
    companyId: string,
    slug: string
  ): Promise<Flow | null> {
    return this.prisma.flow.findUnique({
      where: {
        companyId_slug: {
          companyId,
          slug
        }
      }
    });
  }

  async update(
    id: string,
    companyId: string,
    data: Prisma.FlowUpdateInput
  ): Promise<FlowWithQuestions | null> {
    const result = await this.prisma.flow.updateMany({
      where: {
        id,
        companyId
      },
      data
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdAndCompanyId(id, companyId);
  }

  publish(id: string, companyId: string): Promise<FlowWithQuestions | null> {
    return this.update(id, companyId, {
      status: FlowStatus.PUBLISHED
    });
  }

  unpublish(id: string, companyId: string): Promise<FlowWithQuestions | null> {
    return this.update(id, companyId, {
      status: FlowStatus.DRAFT
    });
  }
}
