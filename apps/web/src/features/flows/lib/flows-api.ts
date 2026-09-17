import { privateApi } from "../../auth/lib/private-api";
import type { Flow, FlowFormValues } from "../types/flow";

type FlowPayload = {
  name: string;
  slug: string;
  description?: string | null;
};

export function getFlows(): Promise<Flow[]> {
  return privateApi<Flow[]>("/flows");
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

function toPayload(values: FlowFormValues): FlowPayload {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description.trim() ? values.description : null
  };
}
