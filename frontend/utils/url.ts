/**
 * URL utility functions for Supabase Storage and web links.
 */

export function getFullImageUrl(url: string): string {
  if (!url) return "";
  return url;
}

export function isValidHttpUrl(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isGitHubUrl(value: string): boolean {
  if (!isValidHttpUrl(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname === "github.com" || url.hostname.endsWith(".github.com");
  } catch {
    return false;
  }
}
