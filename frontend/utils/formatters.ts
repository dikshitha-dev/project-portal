/**
 * Date and data formatting utilities.
 */

/**
 * Format an ISO date string to a human-readable date.
 * e.g. "2024-03-15T10:30:00Z" → "Mar 15, 2024"
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Format an ISO date string to a relative time string.
 * e.g. "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

/**
 * Format a numeric grade total to a letter grade display.
 * e.g. 87.5 → "87.5 / 100"
 */
export function formatGradeScore(total: number | null | undefined): string {
  if (total == null) return "—";
  return `${Math.round(total * 10) / 10} / 100`;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert a snake_case string to Title Case.
 * e.g. "what_learned" → "What Learned"
 */
export function snakeToTitle(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Truncate a string to maxLength characters, adding "…" if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}
