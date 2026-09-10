"use client";

import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "submitted"
  | "approved"
  | "rejected"
  | "needs-changes"
  | "pending"
  | "draft"
  | "default";

interface BadgeProps {
  /** Text to display inside the badge */
  label: string;
  /** Visual variant — controls color */
  variant?: BadgeVariant;
  /** Additional class names */
  className?: string;
}

// ─── Variant Config ───────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  submitted:
    "bg-blue-50 text-blue-700 border-blue-200",
  approved:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:
    "bg-red-50 text-red-700 border-red-200",
  "needs-changes":
    "bg-amber-50 text-amber-700 border-amber-200",
  pending:
    "bg-orange-50 text-orange-700 border-orange-200",
  draft:
    "bg-gray-50 text-gray-600 border-gray-200",
  default:
    "bg-gray-100 text-gray-700 border-gray-200",
};

const VARIANT_DOTS: Record<BadgeVariant, string> = {
  submitted: "bg-blue-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  "needs-changes": "bg-amber-500",
  pending: "bg-orange-500",
  draft: "bg-gray-400",
  default: "bg-gray-400",
};

/**
 * Derives a BadgeVariant from a status string (case-insensitive).
 * Useful when the status comes directly from an API response.
 */
export function inferVariant(status: string | null | undefined): BadgeVariant {
  const s = (status || "").toLowerCase().replace(/\s+/g, "-");
  if (s === "submitted") return "submitted";
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "needs-changes" || s === "needs_changes") return "needs-changes";
  if (s === "pending" || s === "pending-review" || s === "pending_review")
    return "pending";
  if (s === "draft") return "draft";
  return "default";
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Reusable status badge with built-in variant styles.
 *
 * @example
 * <Badge label="Approved" variant="approved" />
 * <Badge label={submission.status} variant={inferVariant(submission.status)} />
 */
export default function Badge({ label, variant = "default", className = "" }: BadgeProps) {
  const style = VARIANT_STYLES[variant];
  const dot = VARIANT_DOTS[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
