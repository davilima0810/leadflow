export type LeadListItem = {
  id: string;
  createdAt: string;
  flow: {
    id: string;
    name: string;
  };
};

export type LeadAnswer = {
  questionId: string;
  question: string;
  type: string;
  semanticType: string;
  value: unknown;
  displayValue: unknown;
};

export type LeadDetail = LeadListItem & {
  contact: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  answers: LeadAnswer[];
  summary: string;
  whatsappUrl: string | null;
};
