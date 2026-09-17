import { BadRequestException, Injectable } from "@nestjs/common";
import { QuestionType } from "@prisma/client";
import type { PublicFlowRecord } from "./public-flow.repository";
import type {
  PublicAnswerValue,
  PublicFlowSubmissionAnswerDto
} from "./dto/create-public-flow-submission.dto";

type NormalizedAnswer = {
  questionId: string;
  value: PublicAnswerValue;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const MAX_STRING_ANSWER_LENGTH = 2000;
const MAX_MULTIPLE_CHOICE_VALUES = 50;

@Injectable()
export class SubmissionValidator {
  validate(
    flow: PublicFlowRecord,
    answers: PublicFlowSubmissionAnswerDto[]
  ): NormalizedAnswer[] {
    const questionsById = new Map(
      flow.questions.map((question) => [question.id, question])
    );
    const answersByQuestionId = new Map<string, PublicAnswerValue>();

    for (const answer of answers) {
      if (!questionsById.has(answer.questionId)) {
        throw new BadRequestException(
          "A submissão contém uma pergunta que não pertence ao flow."
        );
      }

      if (answersByQuestionId.has(answer.questionId)) {
        throw new BadRequestException(
          "A submissão contém resposta duplicada para uma pergunta."
        );
      }

      answersByQuestionId.set(answer.questionId, answer.value);
    }

    for (const question of flow.questions) {
      const value = answersByQuestionId.get(question.id);

      if (question.required && !this.hasRequiredValue(value)) {
        throw new BadRequestException(
          `A pergunta "${question.label}" precisa ser respondida.`
        );
      }

      if (value === undefined || value === null || value === "") {
        continue;
      }

      this.validateAnswerValue(question, value);
    }

    return Array.from(answersByQuestionId.entries()).map(
      ([questionId, value]) => ({
        questionId,
        value
      })
    );
  }

  private hasRequiredValue(value: PublicAnswerValue | undefined) {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (typeof value === "number") {
      return Number.isFinite(value);
    }

    return typeof value === "boolean";
  }

  private validateAnswerValue(
    question: PublicFlowRecord["questions"][number],
    value: PublicAnswerValue
  ) {
    switch (question.type) {
      case QuestionType.TEXT:
      case QuestionType.TEXTAREA:
      case QuestionType.PHONE:
        this.ensureString(question.label, value);
        return;
      case QuestionType.EMAIL:
        this.ensureEmail(question.label, value);
        return;
      case QuestionType.NUMBER:
        this.ensureNumber(question.label, value);
        return;
      case QuestionType.DATE:
        this.ensureDate(question.label, value);
        return;
      case QuestionType.TIME:
        this.ensureTime(question.label, value);
        return;
      case QuestionType.SINGLE_CHOICE:
        this.ensureSingleChoice(question, value);
        return;
      case QuestionType.MULTIPLE_CHOICE:
        this.ensureMultipleChoice(question, value);
        return;
      case QuestionType.BOOLEAN:
        this.ensureBoolean(question.label, value);
        return;
    }
  }

  private ensureString(label: string, value: PublicAnswerValue): string {
    if (typeof value !== "string") {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" precisa ser texto.`
      );
    }

    if (value.length > MAX_STRING_ANSWER_LENGTH) {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" está muito longa.`
      );
    }

    return value;
  }

  private ensureNumber(label: string, value: PublicAnswerValue) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" precisa ser número.`
      );
    }
  }

  private ensureBoolean(label: string, value: PublicAnswerValue) {
    if (typeof value !== "boolean") {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" precisa ser sim ou não.`
      );
    }
  }

  private ensureEmail(label: string, value: PublicAnswerValue) {
    const email = this.ensureString(label, value);

    if (!EMAIL_PATTERN.test(email)) {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" precisa ser um email válido.`
      );
    }
  }

  private ensureDate(label: string, value: PublicAnswerValue) {
    const date = this.ensureString(label, value);

    if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" precisa ser uma data válida.`
      );
    }
  }

  private ensureTime(label: string, value: PublicAnswerValue) {
    const time = this.ensureString(label, value);

    if (!TIME_PATTERN.test(time)) {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" precisa ser um horário válido.`
      );
    }

    const [hours, minutes] = time.split(":").map(Number);

    if (hours > 23 || minutes > 59) {
      throw new BadRequestException(
        `A resposta da pergunta "${label}" precisa ser um horário válido.`
      );
    }
  }

  private ensureSingleChoice(
    question: PublicFlowRecord["questions"][number],
    value: PublicAnswerValue
  ) {
    const selectedValue = this.ensureString(question.label, value);

    const allowedValues = new Set(
      question.options.map((option) => option.value)
    );

    if (!allowedValues.has(selectedValue)) {
      throw new BadRequestException(
        `A resposta da pergunta "${question.label}" precisa ser uma opção válida.`
      );
    }
  }

  private ensureMultipleChoice(
    question: PublicFlowRecord["questions"][number],
    value: PublicAnswerValue
  ) {
    if (!Array.isArray(value)) {
      throw new BadRequestException(
        `A resposta da pergunta "${question.label}" precisa ser uma lista de opções.`
      );
    }

    if (value.length > MAX_MULTIPLE_CHOICE_VALUES) {
      throw new BadRequestException(
        `A resposta da pergunta "${question.label}" possui opções demais.`
      );
    }

    const selectedValues = new Set<string>();
    const allowedValues = new Set(
      question.options.map((option) => option.value)
    );

    for (const item of value) {
      if (selectedValues.has(item)) {
        throw new BadRequestException(
          `A resposta da pergunta "${question.label}" contém opção duplicada.`
        );
      }

      if (!allowedValues.has(item)) {
        throw new BadRequestException(
          `A resposta da pergunta "${question.label}" contém uma opção inválida.`
        );
      }

      selectedValues.add(item);
    }
  }
}
