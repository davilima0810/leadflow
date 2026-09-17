export type FlowStatus = "DRAFT" | "PUBLISHED";
export type QuestionType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "PHONE"
  | "EMAIL"
  | "DATE"
  | "TIME"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "BOOLEAN";
export type QuestionSemanticType =
  | "NONE"
  | "CONTACT_NAME"
  | "CONTACT_PHONE"
  | "CONTACT_EMAIL";

export type QuestionOption = {
  id?: string;
  questionId?: string;
  label: string;
  value: string;
  position: number;
};

export type Question = {
  id: string;
  flowId: string;
  label: string;
  description: string | null;
  type: QuestionType;
  semanticType: QuestionSemanticType;
  required: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
};

export type Flow = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  status: FlowStatus;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
};

export type FlowFormValues = {
  name: string;
  slug: string;
  description: string;
};

export type QuestionFormValues = {
  label: string;
  description: string;
  type: QuestionType;
  semanticType: QuestionSemanticType;
  required: boolean;
  options: QuestionOption[];
};
