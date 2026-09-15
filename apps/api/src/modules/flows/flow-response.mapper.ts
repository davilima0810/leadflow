import type { Flow, Question, QuestionOption } from "@prisma/client";

type FlowResponseInput = Flow & {
  questions?: Array<Question & { options: QuestionOption[] }>;
};

export function toFlowResponse(flow: FlowResponseInput) {
  return {
    id: flow.id,
    companyId: flow.companyId,
    name: flow.name,
    slug: flow.slug,
    description: flow.description,
    status: flow.status,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
    questions: flow.questions?.map((question) => ({
      id: question.id,
      flowId: question.flowId,
      label: question.label,
      description: question.description,
      type: question.type,
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
    }))
  };
}
