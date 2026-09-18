import type { Company } from "@prisma/client";

export function toCompanyResponse(company: Company) {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    whatsappPhone: company.whatsappPhone
  };
}
