import { User, UserRole } from "@/types";
import { authService } from "./services/auth";
import { getRoleRedirectUrl } from "@/constants/roles";
import { supabase } from "./supabase/client";

export type Role = UserRole;

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await authService.getMe();
    return user;
  } catch {
    return null;
  }
}

export function getRoleRedirect(role: Role): string {
  return getRoleRedirectUrl(role);
}

export async function logout(redirectToLogin = true): Promise<void> {
  await authService.logout();
  if (redirectToLogin && typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const { user } = await authService.getMe();
  return user;
}
