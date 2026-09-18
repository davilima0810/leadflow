import { Injectable } from "@nestjs/common";
import { QuestionSemanticType } from "@prisma/client";
import type { QuestionType } from "@prisma/client";
import type { LeadDetailRecord } from "./lead.repository";

type DisplayValue = string | number | boolean | string[] | null;
type SummaryAnswer = { question: string; displayValue: DisplayValue };

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
        semanticType: answer.question.semanticType,
        value: answer.value,
        displayValue
      };
    });
    const contact = this.getContact(lead.answers);
    const summary = this.buildSummary(lead.flow.name, answers);
    const normalizedContactPhone = this.normalizePhone(contact.phone);

    return {
      id: lead.id,
      createdAt: lead.createdAt,
      flow: {
        id: lead.flow.id,
        name: lead.flow.name
      },
      contact,
      answers,
      summary,
      whatsappUrl: normalizedContactPhone
        ? this.buildLeadWhatsappUrl(normalizedContactPhone, summary, contact.name)
        : null
    };
  }

  buildSummary(flowName: string, answers: SummaryAnswer[]) {
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

  buildPublicSubmissionSummary(flowName: string, answers: SummaryAnswer[]) {
    return [
      `Olá! Acabei de preencher o formulário "${flowName}".`,
      "",
      ...answers.map(
        (answer) =>
          `${answer.question}: ${this.stringifyDisplayValue(answer.displayValue)}`
      ),
      "",
      "Enviado através do LeadFlow."
    ].join("\n");
  }

  buildCompanyWhatsappUrl(phone: string | null, message: string) {
    const normalizedPhone = this.normalizePhone(phone);

    if (!normalizedPhone) {
      return null;
    }

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  }

  getQuestionDisplayValue(
    value: DisplayValue,
    type: QuestionType,
    options: Array<{ label: string; value: string }>
  ): DisplayValue {
    return this.getDisplayValue(value, type, options);
  }

  private buildLeadWhatsappUrl(
    phone: string,
    summary: string,
    contactName: string | null
  ) {
    const greeting = contactName ? `Olá, ${contactName}! Tudo bem?` : "Olá! Tudo bem?";

    return `https://wa.me/${phone}?text=${encodeURIComponent(
      `${greeting}\n\nRecebemos suas informações pelo nosso formulário.\n\n${summary}\n\nPodemos continuar o atendimento por aqui?`
    )}`;
  }

  private getContact(answers: LeadDetailRecord["answers"]) {
    return answers.reduce(
      (contact, answer) => {
        if (
          answer.question.semanticType === QuestionSemanticType.CONTACT_NAME &&
          typeof answer.value === "string"
        ) {
          contact.name = answer.value;
        }

        if (
          answer.question.semanticType === QuestionSemanticType.CONTACT_PHONE &&
          typeof answer.value === "string"
        ) {
          contact.phone = answer.value;
        }

        if (
          answer.question.semanticType === QuestionSemanticType.CONTACT_EMAIL &&
          typeof answer.value === "string"
        ) {
          contact.email = answer.value;
        }

        return contact;
      },
      {
        name: null,
        phone: null,
        email: null
      } as { name: string | null; phone: string | null; email: string | null }
    );
  }

  private normalizePhone(phone: string | null) {
    return phone?.replace(/\D/g, "") || null;
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
