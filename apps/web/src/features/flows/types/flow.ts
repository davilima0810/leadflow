export type FlowStatus = "DRAFT" | "PUBLISHED";

export type Flow = {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  status: FlowStatus;
  createdAt: string;
  updatedAt: string;
};

export type FlowFormValues = {
  name: string;
  slug: string;
  description: string;
};
