"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Submission, ReviewFile } from "@/types";
import { getFullImageUrl } from "@/utils/url";
import { formatDate } from "@/utils/formatters";
import Badge, { inferVariant } from "@/components/common/Badge";

interface SubmissionSelectorProps {
  submissions: Submission[];
  activeSubmission: Submission | null;
  activeImage: ReviewFile | null;
  onSelectSubmission: (sub: Submission) => void;
  onSelectImage: (file: ReviewFile) => void;
}

/**
 * Left-panel sidebar for the admin review workspace.
 * Displays a scrollable list of candidate submissions and the screenshot
 * thumbnails for the selected submission.
 *
 * Extracted from app/review/page.js to reduce its size.
 */
export default function SubmissionSelector({
  submissions,
  activeSubmission,
  activeImage,
  onSelectSubmission,
  onSelectImage,
}: SubmissionSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Submissions List */}
      <div className="card-static">
        <h3 className="font-bold text-gray-900 mb-3 text-sm">
          Submissions ({submissions.length})
        </h3>
        {submissions.length === 0 ? (
          <p className="text-xs text-gray-400">No submissions available.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {submissions.map((sub) => (
              <motion.button
                key={sub.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectSubmission(sub)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                  activeSubmission?.id === sub.id
                    ? "bg-primary-50/80 border-primary-200/80 shadow-sm"
                    : "bg-white/50 hover:bg-white/80 border-gray-100"
                }`}
              >
                <p className="font-semibold text-xs text-gray-900 truncate">
                  {sub.user?.name || "Candidate"}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {sub.week?.week_title || "Week Roadmap"}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-gray-400">
                    {sub.review_files?.length || 0} screenshot(s)
                  </p>
                  {sub.status && (
                    <Badge
                      label={sub.status}
                      variant={inferVariant(sub.status)}
                      className="text-[9px] py-0"
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Screenshot Thumbnails */}
      {activeSubmission && (activeSubmission.review_files?.length ?? 0) > 0 && (
        <div className="card-static">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">
            Screenshots
          </h3>
          <div className="space-y-2">
            {activeSubmission.review_files!.map((file, idx) => (
              <button
                key={file.id}
                onClick={() => onSelectImage(file)}
                className={`w-full rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  activeImage?.id === file.id
                    ? "border-primary-400 shadow-md"
                    : "border-gray-200 hover:border-primary-200"
                }`}
              >
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={getFullImageUrl(file.image_url)}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium">
                    #{idx + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submission Info Card */}
      {activeSubmission && (
        <div className="card-static text-xs space-y-2">
          <h4 className="font-bold text-gray-900 text-sm">Submission Info</h4>
          <div className="space-y-1.5 text-gray-600">
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Candidate</span>
              <span className="font-semibold text-gray-800 text-right truncate max-w-[120px]">
                {activeSubmission.user?.name || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Week</span>
              <span className="font-semibold text-gray-800 text-right truncate max-w-[120px]">
                {activeSubmission.week?.week_title || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-500">Submitted</span>
              <span className="font-semibold text-gray-800">
                {formatDate(activeSubmission.created_at)}
              </span>
            </div>
            {activeSubmission.github_url && (
              <a
                href={activeSubmission.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary-600 hover:text-primary-700 font-semibold truncate text-right"
              >
                Open GitHub Repository ↗
              </a>
            )}
            {activeSubmission.deployed_url && (
              <a
                href={activeSubmission.deployed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary-600 hover:text-primary-700 font-semibold truncate text-right"
              >
                Open Deployed Website ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
