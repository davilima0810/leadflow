import { Injectable } from "@nestjs/common";
import type { Lead, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type CreateSubmissionInput = {
  companyId: string;
  flowId: string;
  answers: Array<{
    questionId: string;
    value: Prisma.InputJsonValue;
  }>;
};

@Injectable()
export class LeadSubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateSubmissionInput): Promise<Lead> {
    return this.prisma.$transaction(async (tx) =>
      tx.lead.create({
        data: {
          companyId: input.companyId,
          flowId: input.flowId,
          answers: {
            create: input.answers.map((answer) => ({
              questionId: answer.questionId,
              value: answer.value
            }))
          }
        },
        include: {
          answers: true
        }
      })
    );
  }
}
