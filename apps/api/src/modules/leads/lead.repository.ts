import { Injectable } from "@nestjs/common";
import type {
  Flow,
  Lead,
  LeadAnswer,
  Question,
  QuestionOption
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type LeadDetailRecord = Lead & {
  flow: Pick<Flow, "id" | "name">;
  answers: Array<
    LeadAnswer & {
      question: Pick<
        Question,
        "id" | "label" | "type" | "semanticType" | "position"
      > & {
        options: Array<Pick<QuestionOption, "label" | "value" | "position">>;
      };
    }
  >;
};

@Injectable()
export class LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByCompanyId(companyId: string): Promise<LeadDetailRecord[]> {
    return this.prisma.lead.findMany({
      where: {
        companyId
      },
      orderBy: {
        createdAt: "desc"
      },
      include: this.detailInclude()
    });
  }

  findByIdAndCompanyId(
    id: string,
    companyId: string
  ): Promise<LeadDetailRecord | null> {
    return this.prisma.lead.findFirst({
      where: {
        id,
        companyId
      },
      include: this.detailInclude()
    });
  }

  private detailInclude() {
    return {
      flow: {
        select: {
          id: true,
          name: true
        }
      },
      answers: {
        orderBy: {
          question: {
            position: "asc" as const
          }
        },
        include: {
          question: {
            select: {
              id: true,
              label: true,
              type: true,
              semanticType: true,
              position: true,
              options: {
                orderBy: {
                  position: "asc" as const
                },
                select: {
                  label: true,
                  value: true,
                  position: true
                }
              }
            }
          }
        }
      }
    };
  }
}
