import { clearAuthToken } from "./auth-token";
import { privateApi } from "./private-api";
import type { AuthSession } from "../types/auth";

export type CurrentSession = Omit<AuthSession, "accessToken">;

export function getCurrentSession(): Promise<CurrentSession> {
  return privateApi<CurrentSession>("/auth/me");
}

export function logout() {
  clearAuthToken();
}
