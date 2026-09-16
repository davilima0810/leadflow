import { Injectable } from "@nestjs/common";
import type { QuestionType } from "@prisma/client";
import type { LeadDetailRecord } from "./lead.repository";

type DisplayValue = string | number | boolean | string[] | null;

@Injectable()
export class LeadPresenterService {
  toListItem(lead: LeadDetailRecord) {
    return {
      id: lead.id,
      createdAt: lead.createdAt,
      flow: {
        id: lead.flow.id,
        name: lead.flow.name
      }
    };
  }

  toDetail(lead: LeadDetailRecord) {
    const answers = lead.answers.map((answer) => {
      const displayValue = this.getDisplayValue(
        answer.value as DisplayValue,
        answer.question.type,
        answer.question.options
      );

      return {
        questionId: answer.questionId,
        question: answer.question.label,
        type: answer.question.type,
        value: answer.value,
        displayValue
      };
    });
    const summary = this.buildSummary(lead.flow.name, answers);

    return {
      id: lead.id,
      createdAt: lead.createdAt,
      flow: {
        id: lead.flow.id,
        name: lead.flow.name
      },
      answers,
      summary,
      whatsappUrl: lead.company.whatsappPhone
        ? this.buildWhatsappUrl(lead.company.whatsappPhone, summary)
        : null
    };
  }

  private buildSummary(
    flowName: string,
    answers: Array<{ question: string; displayValue: DisplayValue }>
  ) {
    return [
      flowName,
      "",
      ...answers.flatMap((answer) => [
        answer.question,
        this.stringifyDisplayValue(answer.displayValue),
        ""
      ]),
      "Gerado pelo LeadFlow."
    ].join("\n");
  }

  private buildWhatsappUrl(phone: string, summary: string) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(
      `Novo lead - LeadFlow\n\n${summary}`
    )}`;
  }

  private getDisplayValue(
    value: DisplayValue,
    type: QuestionType,
    options: Array<{ label: string; value: string }>
  ): DisplayValue {
    if (type === "SINGLE_CHOICE" && typeof value === "string") {
      return options.find((option) => option.value === value)?.label ?? value;
    }

    if (type === "MULTIPLE_CHOICE" && Array.isArray(value)) {
      return value.map(
        (item) => options.find((option) => option.value === item)?.label ?? item
      );
    }

    return value;
  }

  private stringifyDisplayValue(value: DisplayValue) {
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "boolean") {
      return value ? "Sim" : "Não";
    }

    if (value === null) {
      return "";
    }

    return String(value);
  }
}
