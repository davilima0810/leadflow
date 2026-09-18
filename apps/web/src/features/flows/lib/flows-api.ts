import { privateApi } from "../../auth/lib/private-api";
import type {
  Flow,
  FlowAppearanceFormValues,
  FlowFormValues,
  Question,
  QuestionFormValues
} from "../types/flow";

type FlowPayload = {
  name: string;
  slug: string;
  description?: string | null;
};

export function getFlows(): Promise<Flow[]> {
  return privateApi<Flow[]>("/flows");
}

export function getFlow(id: string): Promise<Flow> {
  return privateApi<Flow>(`/flows/${id}`);
}

export function createFlow(values: FlowFormValues): Promise<Flow> {
  return privateApi<Flow>("/flows", {
    method: "POST",
    body: toPayload(values)
  });
}

export function updateFlow(id: string, values: FlowFormValues): Promise<Flow> {
  return privateApi<Flow>(`/flows/${id}`, {
    method: "PATCH",
    body: toPayload(values)
  });
}

export function updateFlowAppearance(
  id: string,
  values: FlowAppearanceFormValues
): Promise<Flow> {
  return privateApi<Flow>(`/flows/${id}`, {
    method: "PATCH",
    body: toAppearancePayload(values)
  });
}

export function uploadFlowLogo(id: string, file: File): Promise<Flow> {
  return uploadFlowImage(`/flows/${id}/logo`, file);
}

export function uploadFlowBackground(id: string, file: File): Promise<Flow> {
  return uploadFlowImage(`/flows/${id}/background`, file);
}

export function removeFlowLogo(id: string): Promise<Flow> {
  return privateApi<Flow>(`/flows/${id}/logo`, {
    method: "DELETE"
  });
}

export function removeFlowBackground(id: string): Promise<Flow> {
  return privateApi<Flow>(`/flows/${id}/background`, {
    method: "DELETE"
  });
}

export function publishFlow(id: string): Promise<Flow> {
  return privateApi<Flow>(`/flows/${id}/publish`, {
    method: "PATCH"
  });
}

export function unpublishFlow(id: string): Promise<Flow> {
  return privateApi<Flow>(`/flows/${id}/unpublish`, {
    method: "PATCH"
  });
}

export function createQuestion(
  flowId: string,
  values: QuestionFormValues,
  position: number
): Promise<Question> {
  return privateApi<Question>(`/flows/${flowId}/questions`, {
    method: "POST",
    body: toQuestionPayload(values, position)
  });
}

export function updateQuestion(
  flowId: string,
  questionId: string,
  values: QuestionFormValues,
  position: number
): Promise<Question> {
  return privateApi<Question>(`/flows/${flowId}/questions/${questionId}`, {
    method: "PATCH",
    body: toQuestionPayload(values, position)
  });
}

export function deleteQuestion(flowId: string, questionId: string) {
  return privateApi<{ deleted: boolean }>(
    `/flows/${flowId}/questions/${questionId}`,
    {
      method: "DELETE"
    }
  );
}

export function reorderQuestions(flowId: string, questionIds: string[]) {
  return privateApi<Question[]>(`/flows/${flowId}/questions/reorder`, {
    method: "PATCH",
    body: {
      questionIds
    }
  });
}

function toPayload(values: FlowFormValues): FlowPayload {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description.trim() ? values.description : null
  };
}

function toAppearancePayload(values: FlowAppearanceFormValues) {
  return {
    coverImageUrl: values.coverImageUrl.trim() || null,
    brandImageDisplay: values.brandImageDisplay,
    primaryColor: values.primaryColor.trim() || null,
    backgroundColor: values.backgroundColor.trim() || null,
    backgroundImageUrl: values.backgroundImageUrl.trim() || null,
    welcomeMessage: values.welcomeMessage.trim() || null,
    externalLinkUrl: values.externalLinkUrl.trim() || null,
    externalLinkLabel: values.externalLinkLabel.trim() || null
  };
}

function uploadFlowImage(path: string, file: File): Promise<Flow> {
  const body = new FormData();
  body.append("file", file);

  return privateApi<Flow>(path, {
    method: "POST",
    body
  });
}

function toQuestionPayload(values: QuestionFormValues, position: number) {
  const choiceType =
    values.type === "SINGLE_CHOICE" || values.type === "MULTIPLE_CHOICE";

  return {
    label: values.label,
    description: values.description.trim() ? values.description : null,
    type: values.type,
    semanticType: values.semanticType,
    required: values.required,
    position,
    options: choiceType
      ? values.options.map((option, index) => ({
          label: option.label,
          value: option.value,
          position: index + 1
        }))
      : []
  };
}
