import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { QuestionSemanticType, QuestionType } from "@prisma/client";
import { StorageService } from "../../common/storage/storage.service";
import {
  parseLocalFlowAssetPath,
  type LocalFlowAssetKind
} from "../../common/storage/storage-url";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { CreateQuestionDto } from "../questions/dto/create-question.dto";
import { ReorderQuestionsDto } from "../questions/dto/reorder-questions.dto";
import { UpdateQuestionDto } from "../questions/dto/update-question.dto";
import { QuestionRepository } from "../questions/question.repository";
import { CreateFlowDto } from "./dto/create-flow.dto";
import { UpdateFlowDto } from "./dto/update-flow.dto";
import { FlowRepository } from "./flow.repository";
import { toFlowResponse } from "./flow-response.mapper";
import type { UploadedImageFile } from "./types/uploaded-image-file";

const CHOICE_TYPES = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE
] as const;

const SEMANTIC_TYPE_ALLOWED_QUESTION_TYPE = {
  [QuestionSemanticType.CONTACT_NAME]: QuestionType.TEXT,
  [QuestionSemanticType.CONTACT_PHONE]: QuestionType.PHONE,
  [QuestionSemanticType.CONTACT_EMAIL]: QuestionType.EMAIL
} as const;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

@Injectable()
export class FlowsService {
  constructor(
    private readonly flowRepository: FlowRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly storageService: StorageService
  ) {}

  async create(dto: CreateFlowDto, currentUser: AuthenticatedUser) {
    await this.ensureSlugAvailable(currentUser.companyId, dto.slug);
    this.rejectLocalAssetOnCreate(dto.coverImageUrl);
    this.rejectLocalAssetOnCreate(dto.backgroundImageUrl);

    const flow = await this.flowRepository.create({
      companyId: currentUser.companyId,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      brandImageDisplay: dto.brandImageDisplay,
      primaryColor: dto.primaryColor,
      backgroundColor: dto.backgroundColor,
      backgroundImageUrl: dto.backgroundImageUrl,
      welcomeMessage: dto.welcomeMessage,
      externalLinkUrl: dto.externalLinkUrl,
      externalLinkLabel: dto.externalLinkLabel
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
    this.validateFlowAssetReference(id, dto.coverImageUrl, "logo");
    this.validateFlowAssetReference(id, dto.backgroundImageUrl, "background");

    const flow = await this.flowRepository.update(id, currentUser.companyId, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      brandImageDisplay: dto.brandImageDisplay,
      primaryColor: dto.primaryColor,
      backgroundColor: dto.backgroundColor,
      backgroundImageUrl: dto.backgroundImageUrl,
      welcomeMessage: dto.welcomeMessage,
      externalLinkUrl: dto.externalLinkUrl,
      externalLinkLabel: dto.externalLinkLabel
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

  async uploadLogo(
    id: string,
    file: UploadedImageFile | undefined,
    currentUser: AuthenticatedUser
  ) {
    return this.uploadFlowImage(id, "logo", "coverImageUrl", file, currentUser);
  }

  async uploadBackground(
    id: string,
    file: UploadedImageFile | undefined,
    currentUser: AuthenticatedUser
  ) {
    return this.uploadFlowImage(
      id,
      "background",
      "backgroundImageUrl",
      file,
      currentUser
    );
  }

  async removeLogo(id: string, currentUser: AuthenticatedUser) {
    return this.removeFlowImage(id, "coverImageUrl", currentUser);
  }

  async removeBackground(id: string, currentUser: AuthenticatedUser) {
    return this.removeFlowImage(id, "backgroundImageUrl", currentUser);
  }

  async addQuestion(
    flowId: string,
    dto: CreateQuestionDto,
    currentUser: AuthenticatedUser
  ) {
    await this.ensureFlowExists(flowId, currentUser.companyId);
    this.validateOptions(dto.type, dto.options);
    const semanticType = dto.semanticType ?? QuestionSemanticType.NONE;
    await this.validateSemanticType(
      flowId,
      currentUser.companyId,
      dto.type,
      semanticType
    );

    const question = await this.questionRepository.create({
      flowId,
      data: {
        label: dto.label,
        description: dto.description,
        type: dto.type,
        semanticType,
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
    const nextSemanticType = dto.semanticType ?? currentQuestion.semanticType;
    let nextOptions = dto.options;

    if (dto.type || dto.options) {
      this.validateOptions(nextType, nextOptions);
    }

    if (dto.type && !this.isChoiceType(nextType) && !nextOptions) {
      nextOptions = [];
    }

    await this.validateSemanticType(
      flowId,
      currentUser.companyId,
      nextType,
      nextSemanticType,
      questionId
    );

    const question = await this.questionRepository.update(
      questionId,
      flowId,
      currentUser.companyId,
      {
        label: dto.label,
        description: dto.description,
        type: dto.type,
        semanticType: dto.semanticType,
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
      semanticType: question.semanticType,
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

  private rejectLocalAssetOnCreate(value: string | null | undefined) {
    if (value && parseLocalFlowAssetPath(value)) {
      throw new BadRequestException(
        "Uploads locais devem pertencer a um Flow existente."
      );
    }
  }

  private validateFlowAssetReference(
    flowId: string,
    value: string | null | undefined,
    expectedKind: LocalFlowAssetKind
  ) {
    if (!value) {
      return;
    }

    const asset = parseLocalFlowAssetPath(value);

    if (!asset) {
      return;
    }

    if (asset.flowId !== flowId || asset.kind !== expectedKind) {
      throw new BadRequestException(
        "Imagem enviada não pertence a este Flow."
      );
    }
  }

  private async uploadFlowImage(
    id: string,
    kind: "logo" | "background",
    field: "coverImageUrl" | "backgroundImageUrl",
    file: UploadedImageFile | undefined,
    currentUser: AuthenticatedUser
  ) {
    this.validateImageFile(file);
    const currentFlow = await this.requireFlow(id, currentUser.companyId);
    const uploaded = await this.storageService.uploadImage({
      buffer: file.buffer,
      flowId: id,
      kind,
      mimeType: file.mimetype
    });
    const flow = await this.flowRepository.update(id, currentUser.companyId, {
      [field]: uploaded.url
    });

    await this.storageService.delete(currentFlow[field]);

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toFlowResponse(flow);
  }

  private async removeFlowImage(
    id: string,
    field: "coverImageUrl" | "backgroundImageUrl",
    currentUser: AuthenticatedUser
  ) {
    const currentFlow = await this.requireFlow(id, currentUser.companyId);
    const flow = await this.flowRepository.update(id, currentUser.companyId, {
      [field]: null
    });

    await this.storageService.delete(currentFlow[field]);

    if (!flow) {
      throw new NotFoundException("Flow não encontrado.");
    }

    return toFlowResponse(flow);
  }

  private validateImageFile(file: UploadedImageFile | undefined): asserts file is UploadedImageFile {
    if (!file) {
      throw new BadRequestException("Arquivo de imagem é obrigatório.");
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException("Formato de imagem inválido.");
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException("Imagem deve ter no máximo 2 MB.");
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

  private async validateSemanticType(
    flowId: string,
    companyId: string,
    type: QuestionType,
    semanticType: QuestionSemanticType,
    ignoreQuestionId?: string
  ) {
    if (semanticType === QuestionSemanticType.NONE) {
      return;
    }

    const allowedType = SEMANTIC_TYPE_ALLOWED_QUESTION_TYPE[semanticType];

    if (type !== allowedType) {
      throw new BadRequestException(
        "semanticType não é compatível com o type da pergunta."
      );
    }

    const existingCount =
      await this.questionRepository.countByFlowIdCompanyIdAndSemanticType(
        flowId,
        companyId,
        semanticType,
        ignoreQuestionId
      );

    if (existingCount > 0) {
      throw new ConflictException(
        "Este semanticType já está em uso neste flow."
      );
    }
  }
}
