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

export type PublicFlowOption = {
  id: string;
  label: string;
  value: string;
  position: number;
};

export type PublicFlowQuestion = {
  id: string;
  label: string;
  description: string | null;
  type: QuestionType;
  required: boolean;
  position: number;
  options: PublicFlowOption[];
};

export type PublicFlow = {
  company: {
    name: string;
    slug: string;
  };
  flow: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    questions: PublicFlowQuestion[];
  };
};

export type PublicFlowAnswer = string | number | boolean | string[] | null;
