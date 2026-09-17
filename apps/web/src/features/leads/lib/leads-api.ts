import { privateApi } from "../../auth/lib/private-api";
import type { LeadDetail, LeadListItem } from "../types/lead";

export function getLeads(): Promise<LeadListItem[]> {
  return privateApi<LeadListItem[]>("/leads");
}

export function getLead(id: string): Promise<LeadDetail> {
  return privateApi<LeadDetail>(`/leads/${id}`);
}
