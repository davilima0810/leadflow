import type { UserRole } from "@prisma/client";

export type AuthResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  accessToken: string;
};
