import type {
  PublicFlowSubmissionPayload,
  PublicFlowSubmissionResponse
} from "../types/public-flow";

export class PublicFlowSubmissionError extends Error {
  constructor(message = "Unable to submit public flow") {
    super(message);
  }
}

export async function submitPublicFlow(
  companySlug: string,
  flowSlug: string,
  payload: PublicFlowSubmissionPayload
): Promise<PublicFlowSubmissionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new PublicFlowSubmissionError("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${apiUrl}/public-flows/${companySlug}/${flowSlug}/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    throw new PublicFlowSubmissionError();
  }

  return response.json();
}
