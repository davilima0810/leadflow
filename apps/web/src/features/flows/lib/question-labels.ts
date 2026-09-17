import type { QuestionSemanticType, QuestionType } from "../types/flow";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  TEXT: "Texto",
  TEXTAREA: "Texto longo",
  NUMBER: "Número",
  PHONE: "Telefone",
  EMAIL: "Email",
  DATE: "Data",
  TIME: "Horário",
  SINGLE_CHOICE: "Escolha única",
  MULTIPLE_CHOICE: "Múltipla escolha",
  BOOLEAN: "Sim / Não"
};

export const SEMANTIC_TYPE_LABELS: Record<QuestionSemanticType, string> = {
  NONE: "Nenhum",
  CONTACT_NAME: "Nome do contato",
  CONTACT_PHONE: "Telefone do contato",
  CONTACT_EMAIL: "Email do contato"
};

export function getAllowedSemanticTypes(
  type: QuestionType
): QuestionSemanticType[] {
  if (type === "TEXT") {
    return ["NONE", "CONTACT_NAME"];
  }

  if (type === "PHONE") {
    return ["NONE", "CONTACT_PHONE"];
  }

  if (type === "EMAIL") {
    return ["NONE", "CONTACT_EMAIL"];
  }

  return ["NONE"];
}
