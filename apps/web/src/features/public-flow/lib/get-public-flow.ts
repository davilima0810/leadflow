import type { PublicFlow } from "../types/public-flow";

export class PublicFlowNotFoundError extends Error {
  constructor() {
    super("Public flow not found");
  }
}

export async function getPublicFlow(
  companySlug: string,
  flowSlug: string
): Promise<PublicFlow> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${apiUrl}/public-flows/${companySlug}/${flowSlug}`,
    {
      cache: "no-store"
    }
  );

  if (response.status === 404) {
    throw new PublicFlowNotFoundError();
  }

  if (!response.ok) {
    throw new Error("Unable to load public flow");
  }

  return response.json();
}
