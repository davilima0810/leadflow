import type { Flow } from "../types/flow";

export function buildPublicFlowUrl(companySlug: string, flow: Pick<Flow, "slug">) {
  if (typeof window === "undefined") {
    return `/c/${companySlug}/${flow.slug}`;
  }

  return `${window.location.origin}/c/${companySlug}/${flow.slug}`;
}
