"use client";

import React, { ReactNode } from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  /** Icon to display. Defaults to FolderOpen if not provided. */
  icon?: ReactNode;
  /** Main heading */
  title: string;
  /** Optional sub-text */
  description?: string;
  /** Optional CTA button or any action element */
  action?: ReactNode;
  /** Additional class names on the wrapper */
  className?: string;
}

/**
 * Reusable empty state card — replaces repeated empty-state UI in every page.
 *
 * @example
 * <EmptyState
 *   icon={<ClipboardList size={32} />}
 *   title="No submissions yet"
 *   description="Candidates haven't submitted any projects yet."
 * />
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`card-static text-center py-16 px-8 rounded-2xl text-gray-400 ${className}`}
    >
      <div className="flex justify-center mb-4">
        <span className="text-gray-300">
          {icon ?? <FolderOpen size={36} />}
        </span>
      </div>
      <p className="text-base font-semibold text-gray-500">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
