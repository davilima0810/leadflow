import { privateApi } from "./private-api";

export type CompanySettings = {
  id: string;
  name: string;
  slug: string;
  whatsappPhone: string | null;
};

export function getCompanySettings(): Promise<CompanySettings> {
  return privateApi<CompanySettings>("/company");
}

export function updateCompanySettings(values: {
  whatsappPhone: string;
}): Promise<CompanySettings> {
  return privateApi<CompanySettings>("/company", {
    method: "PATCH",
    body: {
      whatsappPhone: values.whatsappPhone.trim() || null
    }
  });
}
