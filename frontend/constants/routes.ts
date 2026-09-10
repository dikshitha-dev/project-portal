/**
 * Application route paths.
 * Use these instead of hardcoding "/admin", "/dashboard" etc.
 */
export const ROUTES = {
  // Auth
  LOGIN: "/login",

  // Candidate portal
  CANDIDATE_DASHBOARD: "/dashboard",
  SUBMIT: "/submit",
  WEEK: "/week",
  GRADES: "/grades",
  LINKEDIN: "/linkedin",
  PROJECTS: "/projects",

  // Admin portal
  ADMIN_DASHBOARD: "/admin",
  ADMIN_PROJECTS: "/admin/projects",
  ADMIN_WEEK: "/admin/week",
  ADMIN_LINKEDIN: "/admin/linkedin",
  CANDIDATES: "/candidates",
  REVIEW: "/review",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Returns the home route for a given role.
 */
export function getRoleHome(role: string): string {
  return role === "admin" ? ROUTES.ADMIN_DASHBOARD : ROUTES.CANDIDATE_DASHBOARD;
}
