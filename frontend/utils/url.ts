/**
 * URL utility functions.
 * Single source of truth — replaces duplicated getFullImageUrl() in:
 *   - app/review/page.js
 *   - components/SubmissionDetailView.tsx
 *   - components/SubmissionForm.tsx
 *   - app/admin/linkedin/page.tsx
 */

const API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    : "http://localhost:5000/api";

/**
 * Resolves a stored image URL (which may be a relative path) to a full URL
 * pointing at the backend static file server.
 */
export function getFullImageUrl(url: string): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const backendBase = API_BASE.replace(/\/api\/?$/, "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Returns true if the given string is a valid http/https URL.
 */
export function isValidHttpUrl(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Returns true if the string looks like a GitHub repository URL.
 */
export function isGitHubUrl(value: string): boolean {
  if (!isValidHttpUrl(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname === "github.com" || url.hostname.endsWith(".github.com");
  } catch {
    return false;
  }
}
