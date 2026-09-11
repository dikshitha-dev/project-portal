import { User, authAPI } from "./api";

export type Role = "admin" | "candidate";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function getRole(): Role | null {
  return getStoredUser()?.role ?? null;
}

export function isAdmin(): boolean {
  return getRole() === "admin";
}

export function isCandidate(): boolean {
  return getRole() === "candidate";
}

export function getRoleRedirect(role: Role): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

import { syncUserToSupabase } from "./supabase";

export function saveAuth(token: string, user: User): void {
  setToken(token);
  setStoredUser(user);
  if (user && user.id) {
    syncUserToSupabase({
      id: user.id,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      role: user.role || "candidate",
    }).catch((err) => console.warn("Supabase user sync error:", err));
  }
}

export function logout(redirectToLogin = true): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = "token=; path=/; max-age=0";
  if (redirectToLogin) {
    window.location.href = "/login";
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await authAPI.getMe();
  const user = response.data.user;
  setStoredUser(user);
  return user;
}
