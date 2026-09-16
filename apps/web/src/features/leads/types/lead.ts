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
  value: unknown;
  displayValue: unknown;
};

export type LeadDetail = LeadListItem & {
  answers: LeadAnswer[];
  summary: string;
  whatsappUrl: string | null;
};
