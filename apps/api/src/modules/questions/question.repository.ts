import { Injectable } from "@nestjs/common";
import type { Prisma, Question, QuestionOption } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type QuestionWithOptions = Question & {
  options: QuestionOption[];
};

type CreateQuestionInput = {
  flowId: string;
  data: Omit<Prisma.QuestionUncheckedCreateInput, "flowId" | "options">;
  options?: Prisma.QuestionOptionCreateManyQuestionInput[];
};

type UpdateQuestionInput = {
  label?: string;
  description?: string | null;
  type?: Prisma.QuestionUpdateInput["type"];
  required?: boolean;
  position?: number;
};

@Injectable()
export class QuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateQuestionInput): Promise<QuestionWithOptions> {
    return this.prisma.question.create({
      data: {
        ...input.data,
        flowId: input.flowId,
        options: input.options?.length
          ? {
              createMany: {
                data: input.options
              }
            }
          : undefined
      },
      include: {
        options: {
          orderBy: {
            position: "asc"
          }
        }
      }
    });
  }

  findByIdFlowIdAndCompanyId(
    id: string,
    flowId: string,
    companyId: string
  ): Promise<QuestionWithOptions | null> {
    return this.prisma.question.findFirst({
      where: {
        id,
        flowId,
        flow: {
          companyId
        }
      },
      include: {
        options: {
          orderBy: {
            position: "asc"
          }
        }
      }
    });
  }

  update(
    id: string,
    flowId: string,
    companyId: string,
    data: UpdateQuestionInput,
    options?: Prisma.QuestionOptionCreateManyQuestionInput[]
  ): Promise<QuestionWithOptions | null> {
    return this.prisma.$transaction(async (transaction) => {
      const question = await transaction.question.findFirst({
        where: {
          id,
          flowId,
          flow: {
            companyId
          }
        }
      });

      if (!question) {
        return null;
      }

      await transaction.question.update({
        where: {
          id
        },
        data
      });

      if (options) {
        await transaction.questionOption.deleteMany({
          where: {
            questionId: id
          }
        });

        if (options.length > 0) {
          await transaction.questionOption.createMany({
            data: options.map((option) => ({
              ...option,
              questionId: id
            }))
          });
        }
      }

      return transaction.question.findUnique({
        where: {
          id
        },
        include: {
          options: {
            orderBy: {
              position: "asc"
            }
          }
        }
      });
    });
  }

  async delete(
    id: string,
    flowId: string,
    companyId: string
  ): Promise<boolean> {
    const result = await this.prisma.question.deleteMany({
      where: {
        id,
        flowId,
        flow: {
          companyId
        }
      }
    });

    return result.count > 0;
  }

  countByFlowIdAndCompanyId(flowId: string, companyId: string): Promise<number> {
    return this.prisma.question.count({
      where: {
        flowId,
        flow: {
          companyId
        }
      }
    });
  }

  reorder(
    flowId: string,
    companyId: string,
    questionIds: string[]
  ): Promise<QuestionWithOptions[] | null> {
    return this.prisma.$transaction(async (transaction) => {
      const count = await transaction.question.count({
        where: {
          flowId,
          id: {
            in: questionIds
          },
          flow: {
            companyId
          }
        }
      });

      if (count !== questionIds.length) {
        return null;
      }

      await Promise.all(
        questionIds.map((questionId, index) =>
          transaction.question.update({
            where: {
              id: questionId
            },
            data: {
              position: index + 1
            }
          })
        )
      );

      return transaction.question.findMany({
        where: {
          flowId
        },
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
      });
    });
  }
}
