import { User, UserRole } from "@/types";
import { authService } from "./services/auth";
import { getRoleRedirectUrl } from "@/constants/roles";
import { supabase } from "./supabase/client";

export type Role = UserRole;

const USER_KEY = "user";

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
  return Boolean(getStoredUser());
}

export function getRole(): Role | null {
  return getStoredUser()?.role ?? null;
}

export function isAdmin(): boolean {
  return getRole() === "admin";
}

export function isMentor(): boolean {
  return getRole() === "mentor";
}

export function isCandidate(): boolean {
  return getRole() === "candidate";
}

export function getRoleRedirect(role: Role): string {
  return getRoleRedirectUrl(role);
}

export function saveAuth(token: string, user: User): void {
  setStoredUser(user);
}

export async function logout(redirectToLogin = true): Promise<void> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
  }
  await authService.logout();
  if (redirectToLogin && typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const { user } = await authService.getMe();
  setStoredUser(user);
  return user;
}
