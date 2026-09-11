import { UserRole } from "@/types";

export const ROLES = {
  ADMIN: "admin" as UserRole,
  MENTOR: "mentor" as UserRole,
  CANDIDATE: "candidate" as UserRole,
};

export function isAdminRole(role?: string | null): boolean {
  return role === ROLES.ADMIN;
}

export function isMentorRole(role?: string | null): boolean {
  return role === ROLES.MENTOR;
}

export function isCandidateRole(role?: string | null): boolean {
  return role === ROLES.CANDIDATE;
}

export function getRoleRedirectUrl(role?: string | null): string {
  if (role === ROLES.ADMIN) return "/admin";
  if (role === ROLES.MENTOR) return "/mentor";
  return "/dashboard";
}
