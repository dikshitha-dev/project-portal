/**
 * User role constants.
 * Use these instead of hardcoding "admin" / "candidate" strings.
 */
export const ROLES = {
  ADMIN: "admin",
  CANDIDATE: "candidate",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
