import { clearAuthToken, getAuthToken } from "../../auth/lib/auth-token";
import type { LeadDetail, LeadListItem } from "../types/lead";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

async function privateFetch(path: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = getAuthToken();

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  if (!token) {
    throw new UnauthorizedError();
  }

  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    clearAuthToken();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    throw new Error("Unable to load leads");
  }

  return response.json();
}

export function getLeads(): Promise<LeadListItem[]> {
  return privateFetch("/leads");
}

export function getLead(id: string): Promise<LeadDetail> {
  return privateFetch(`/leads/${id}`);
}
