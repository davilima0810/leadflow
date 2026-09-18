import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { LeadPresenterService } from "../leads/lead-presenter.service";
import { CreatePublicFlowSubmissionDto } from "./dto/create-public-flow-submission.dto";
import { LeadSubmissionRepository } from "./lead-submission.repository";
import { PublicFlowParamsDto } from "./dto/public-flow-params.dto";
import { PublicFlowRepository } from "./public-flow.repository";
import { toPublicFlowResponse } from "./public-flow-response.mapper";
import { SubmissionValidator } from "./submission-validator";

@Injectable()
export class PublicFlowsService {
  constructor(
    private readonly publicFlowRepository: PublicFlowRepository,
    private readonly leadSubmissionRepository: LeadSubmissionRepository,
    private readonly submissionValidator: SubmissionValidator,
    private readonly leadPresenterService: LeadPresenterService
  ) {}

  async getBySlugs(params: PublicFlowParamsDto) {
    const flow =
      await this.publicFlowRepository.findPublishedByCompanySlugAndFlowSlug(
        params.companySlug,
        params.flowSlug
      );

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toPublicFlowResponse(flow);
  }

  async submit(params: PublicFlowParamsDto, dto: CreatePublicFlowSubmissionDto) {
    const flow =
      await this.publicFlowRepository.findPublishedByCompanySlugAndFlowSlug(
        params.companySlug,
        params.flowSlug
      );

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    const answers = this.submissionValidator.validate(flow, dto.answers);
    const lead = await this.leadSubmissionRepository.create({
      companyId: flow.companyId,
      flowId: flow.id,
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        value: answer.value as Prisma.InputJsonValue
      }))
    });
    const summary = this.leadPresenterService.buildPublicSubmissionSummary(
      flow.name,
      answers.map((answer) => {
        const question = flow.questions.find(
          (currentQuestion) => currentQuestion.id === answer.questionId
        );
        const value = answer.value as string | number | boolean | string[] | null;

        return {
          question: question?.label ?? "Resposta",
          displayValue: question
            ? this.leadPresenterService.getQuestionDisplayValue(
                value,
                question.type,
                question.options
              )
            : value
        };
      })
    );
    const whatsappUrl = this.leadPresenterService.buildCompanyWhatsappUrl(
      flow.company.whatsappPhone,
      summary
    );

    return {
      id: lead.id,
      leadId: lead.id,
      status: "created",
      whatsapp: {
        available: Boolean(whatsappUrl),
        url: whatsappUrl
      }
    };
  }
}
