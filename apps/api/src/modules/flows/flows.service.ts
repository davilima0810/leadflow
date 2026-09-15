import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { QuestionType } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CreateQuestionDto } from "../questions/dto/create-question.dto";
import { ReorderQuestionsDto } from "../questions/dto/reorder-questions.dto";
import { UpdateQuestionDto } from "../questions/dto/update-question.dto";
import { QuestionRepository } from "../questions/question.repository";
import { CreateFlowDto } from "./dto/create-flow.dto";
import { UpdateFlowDto } from "./dto/update-flow.dto";
import { FlowRepository } from "./flow.repository";
import { toFlowResponse } from "./flow-response.mapper";

const CHOICE_TYPES = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE
] as const;

@Injectable()
export class FlowsService {
  constructor(
    private readonly flowRepository: FlowRepository,
    private readonly questionRepository: QuestionRepository
  ) {}

  async create(dto: CreateFlowDto, currentUser: AuthenticatedUser) {
    await this.ensureSlugAvailable(currentUser.companyId, dto.slug);

    const flow = await this.flowRepository.create({
      companyId: currentUser.companyId,
      name: dto.name,
      slug: dto.slug,
      description: dto.description
    });

    return toFlowResponse(flow);
  }

  async list(currentUser: AuthenticatedUser) {
    const flows = await this.flowRepository.findManyByCompanyId(
      currentUser.companyId
    );

    return flows.map((flow) => toFlowResponse(flow));
  }

  async get(id: string, currentUser: AuthenticatedUser) {
    const flow = await this.flowRepository.findByIdAndCompanyId(
      id,
      currentUser.companyId
    );

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toFlowResponse(flow);
  }

  async update(id: string, dto: UpdateFlowDto, currentUser: AuthenticatedUser) {
    if (dto.slug) {
      await this.ensureSlugAvailable(currentUser.companyId, dto.slug, id);
    }

    const flow = await this.flowRepository.update(id, currentUser.companyId, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description
    });

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toFlowResponse(flow);
  }

  async publish(id: string, currentUser: AuthenticatedUser) {
    const questionCount = await this.questionRepository.countByFlowIdAndCompanyId(
      id,
      currentUser.companyId
    );

    if (questionCount === 0) {
      throw new BadRequestException("Flow precisa ter pelo menos uma pergunta.");
    }

    const flow = await this.flowRepository.publish(id, currentUser.companyId);

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toFlowResponse(flow);
  }

  async unpublish(id: string, currentUser: AuthenticatedUser) {
    const flow = await this.flowRepository.unpublish(id, currentUser.companyId);

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toFlowResponse(flow);
  }

  async addQuestion(
    flowId: string,
    dto: CreateQuestionDto,
    currentUser: AuthenticatedUser
  ) {
    await this.ensureFlowExists(flowId, currentUser.companyId);
    this.validateOptions(dto.type, dto.options);

    const question = await this.questionRepository.create({
      flowId,
      data: {
        label: dto.label,
        description: dto.description,
        type: dto.type,
        required: dto.required ?? false,
        position: dto.position
      },
      options: dto.options
    });

    return toFlowResponse({
      ...(await this.requireFlow(flowId, currentUser.companyId)),
      questions: [question]
    }).questions?.[0];
  }

  async updateQuestion(
    flowId: string,
    questionId: string,
    dto: UpdateQuestionDto,
    currentUser: AuthenticatedUser
  ) {
    const currentQuestion =
      await this.questionRepository.findByIdFlowIdAndCompanyId(
        questionId,
        flowId,
        currentUser.companyId
      );

    if (!currentQuestion) {
      throw new NotFoundException("Pergunta não encontrada.");
    }

    const nextType = dto.type ?? currentQuestion.type;
    let nextOptions = dto.options;

    if (dto.type || dto.options) {
      this.validateOptions(nextType, nextOptions);
    }

    if (dto.type && !this.isChoiceType(nextType) && !nextOptions) {
      nextOptions = [];
    }

    const question = await this.questionRepository.update(
      questionId,
      flowId,
      currentUser.companyId,
      {
        label: dto.label,
        description: dto.description,
        type: dto.type,
        required: dto.required,
        position: dto.position
      },
      nextOptions
    );

    if (!question) {
      throw new NotFoundException("Pergunta não encontrada.");
    }

    return toFlowResponse({
      ...(await this.requireFlow(flowId, currentUser.companyId)),
      questions: [question]
    }).questions?.[0];
  }

  async removeQuestion(
    flowId: string,
    questionId: string,
    currentUser: AuthenticatedUser
  ) {
    const deleted = await this.questionRepository.delete(
      questionId,
      flowId,
      currentUser.companyId
    );

    if (!deleted) {
      throw new NotFoundException("Pergunta não encontrada.");
    }

    return {
      deleted: true
    };
  }

  async reorderQuestions(
    flowId: string,
    dto: ReorderQuestionsDto,
    currentUser: AuthenticatedUser
  ) {
    await this.ensureFlowExists(flowId, currentUser.companyId);

    const questions = await this.questionRepository.reorder(
      flowId,
      currentUser.companyId,
      dto.questionIds
    );

    if (!questions) {
      throw new BadRequestException(
        "Todas as perguntas informadas devem pertencer ao flow."
      );
    }

    return questions.map((question) => ({
      id: question.id,
      flowId: question.flowId,
      label: question.label,
      description: question.description,
      type: question.type,
      required: question.required,
      position: question.position,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      options: question.options.map((option) => ({
        id: option.id,
        questionId: option.questionId,
        label: option.label,
        value: option.value,
        position: option.position,
        createdAt: option.createdAt,
        updatedAt: option.updatedAt
      }))
    }));
  }

  private async ensureSlugAvailable(
    companyId: string,
    slug: string,
    ignoreFlowId?: string
  ) {
    const existingFlow = await this.flowRepository.findByCompanyIdAndSlug(
      companyId,
      slug
    );

    if (existingFlow && existingFlow.id !== ignoreFlowId) {
      throw new ConflictException("Slug do flow já está em uso.");
    }
  }

  private async ensureFlowExists(flowId: string, companyId: string) {
    await this.requireFlow(flowId, companyId);
  }

  private async requireFlow(flowId: string, companyId: string) {
    const flow = await this.flowRepository.findByIdAndCompanyId(
      flowId,
      companyId
    );

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return flow;
  }

  private validateOptions(
    type: QuestionType,
    options?: Array<{ label: string; value: string; position: number }>
  ) {
    if (!this.isChoiceType(type)) {
      if (options && options.length > 0) {
        throw new BadRequestException(
          "Options são permitidas apenas para perguntas de escolha."
        );
      }

      return;
    }

    if (!options || options.length === 0) {
      throw new BadRequestException(
        "Perguntas de escolha precisam ter pelo menos uma option."
      );
    }
  }

  private isChoiceType(type: QuestionType) {
    return CHOICE_TYPES.includes(type as (typeof CHOICE_TYPES)[number]);
  }
}
