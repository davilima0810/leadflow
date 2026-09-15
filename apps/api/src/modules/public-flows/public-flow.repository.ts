import { Injectable } from "@nestjs/common";
import type { Company, Flow, Question, QuestionOption } from "@prisma/client";
import { FlowStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type PublicFlowRecord = Flow & {
  company: Pick<Company, "name" | "slug">;
  questions: Array<Question & { options: QuestionOption[] }>;
};

@Injectable()
export class PublicFlowRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedByCompanySlugAndFlowSlug(
    companySlug: string,
    flowSlug: string
  ): Promise<PublicFlowRecord | null> {
    return this.prisma.flow.findFirst({
      where: {
        slug: flowSlug,
        status: FlowStatus.PUBLISHED,
        company: {
          slug: companySlug
        }
      },
      include: {
        company: {
          select: {
            name: true,
            slug: true
          }
        },
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
}
