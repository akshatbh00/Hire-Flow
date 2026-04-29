/**
 * lib/auth.ts — auth helpers, token management, route guards
 */
import { authApi, TokenResponse, UserOut } from "./api";

export const TOKEN_KEY = "hf_token";
export const USER_KEY  = "hf_user";

export function saveSession(token: TokenResponse) {
  localStorage.setItem(TOKEN_KEY, token.access_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id:   token.user_id,
      role: token.role,
      tier: token.tier,
    })
  );
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): { id: string; role: string; tier: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function isRecruiter(): boolean {
  const u = getStoredUser();
  return u?.role === "recruiter" || u?.role === "admin";
}

export function isPremium(): boolean {
  const u = getStoredUser();
  return u?.tier === "premium";
}

export async function fetchAndSaveMe(): Promise<UserOut> {
  const user = await authApi.me();
  localStorage.setItem(USER_KEY, JSON.stringify({
    id:   user.id,
    role: user.role,
    tier: user.tier,
  }));
  return user;
}