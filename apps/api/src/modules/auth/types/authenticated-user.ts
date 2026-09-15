import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  userId: string;
  companyId: string;
  role: UserRole;
};
