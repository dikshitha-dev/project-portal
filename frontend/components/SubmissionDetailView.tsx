"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Submission, Week, ReviewFile } from "@/lib/api";
import {
  ExternalLink,
  Github,
  Globe,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Image as ImageIcon,
  BookOpen,
  X,
  Maximize2,
  User as UserIcon,
  FolderGit2,
} from "lucide-react";

interface SubmissionDetailViewProps {
  submission: Submission;
  week?: Week | null;
  projectName?: string;
  onEdit?: () => void;
  isAdmin?: boolean;
  onSelectScreenshotForReview?: (file: ReviewFile) => void;
}

function getFullImageUrl(url: string): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const backendBase = apiBase.replace(/\/api\/?$/, "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function SubmissionDetailView({
  submission,
  week,
  projectName,
  onEdit,
  isAdmin = false,
  onSelectScreenshotForReview,
}: SubmissionDetailViewProps) {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const targetWeek = week || submission.week;
  const files = submission.review_files || [];
  const status = submission.status || "Submitted";

  // Parse objectives (stored in project_description) or fallback
  const whatBuilt =
    submission.project_description ||
    submission.reflection ||
    "No project objectives provided.";
  const whatLearned = submission.what_learned || "";
  const difficultiesFaced = submission.difficulties_faced || "";

  const formattedDate = submission.created_at
    ? new Date(submission.created_at).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Recently submitted";

  return (
    <div className="space-y-6">
      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
              <img
                src={getFullImageUrl(lightboxImg)}
                alt="Enlarged screenshot preview"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-50/90 via-indigo-50/70 to-purple-50/80 border border-primary-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-primary-700 uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full border border-primary-200">
                {targetWeek?.week_title || "Weekly Submission"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>{status}</span>
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mt-2">
              {projectName ? `${projectName} • ` : ""}
              {targetWeek?.week_title || "Project Milestone"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-primary-500" />
              <span>Submitted on {formattedDate}</span>
            </p>
          </div>

          {/* Action Buttons */}
          {onEdit && !isAdmin && (
            <motion.button
              type="button"
              onClick={onEdit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 font-semibold self-start sm:self-center shadow-sm hover:border-primary-300 hover:text-primary-600"
            >
              <Edit3 size={15} />
              <span>Edit Submission</span>
            </motion.button>
          )}
        </div>

        {/* Candidate Information (Prominent for Admin) */}
        {(isAdmin || submission.user) && (
          <div className="mt-4 pt-4 border-t border-primary-100/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Candidate Name</span>
              <span className="font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                <UserIcon size={12} className="text-primary-500" />
                {submission.user?.name || "Candidate"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Candidate ID / Email</span>
              <span className="font-mono text-gray-700 truncate block mt-0.5" title={submission.user?.email || submission.user_id}>
                {submission.user?.email || submission.user_id}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Deliverable / Project</span>
              <span className="font-semibold text-gray-800 mt-0.5 block">
                {projectName || "Project Deliverables"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Submission ID</span>
              <span className="font-mono text-gray-500 truncate block mt-0.5" title={submission.id}>
                {submission.id.slice(0, 13)}...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: PROJECT LINKS */}
      <div className="card-static rounded-2xl p-6 bg-white border border-gray-200/80 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Globe size={16} className="text-primary-600" />
          <span>Project Links</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* GitHub Repository */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              GitHub Repository
            </span>
            {submission.github_url ? (
              <a
                href={submission.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm hover:shadow group"
              >
                <Github size={15} className="text-gray-300 group-hover:text-white" />
                <span>Open GitHub Repository</span>
                <ExternalLink size={13} className="text-gray-400 group-hover:text-white" />
              </a>
            ) : (
              <span className="text-xs text-gray-400 italic font-medium">
                Not provided
              </span>
            )}
          </div>

          {/* Deployed Website */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
              Deployed Website
            </span>
            {submission.deployed_url ? (
              <a
                href={submission.deployed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-glow hover:shadow-lg group"
              >
                <Globe size={15} className="text-primary-200 group-hover:text-white" />
                <span>Open Deployed Website</span>
                <ExternalLink size={13} className="text-primary-200 group-hover:text-white" />
              </a>
            ) : (
              <span className="text-xs text-gray-400 italic font-medium">
                Not provided
              </span>
            )}
          </div>
        </div>

        {submission.linkedin_url && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              LinkedIn Post Link
            </span>
            <a
              href={submission.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              <span>{submission.linkedin_url}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* WEEKLY OBJECTIVES NOTE (from admin-defined week) */}
      {targetWeek?.objective && (
        <div className="card-static rounded-2xl p-5 bg-white border border-gray-200/80 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-primary-500" />
            <span>Weekly Milestone Goals</span>
          </h4>
          <p className="text-xs text-gray-700 leading-relaxed bg-primary-50/50 p-3.5 rounded-xl border border-primary-100/60 font-medium">
            {targetWeek.objective}
          </p>
        </div>
      )}

      {/* SECTION: PROJECT OBJECTIVES (candidate-submitted) */}
      <div className="card-static rounded-2xl p-6 bg-white border border-gray-200/80 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <FolderGit2 size={16} className="text-primary-600" />
          <span>Project Objectives</span>
        </h4>
        <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {whatBuilt}
          </p>
        </div>

        {/* Legacy reflection fields — only when present (older submissions / admin review) */}
        {(submission.what_learned || submission.difficulties_faced) && (
          <div className="grid grid-cols-1 gap-4 pt-2">
            {submission.what_learned && (
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 space-y-1.5">
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wider block">
                  What did you learn?
                </span>
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {whatLearned}
                </p>
              </div>
            )}
            {submission.difficulties_faced && (
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 space-y-1.5">
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wider block">
                  What difficulties did you face?
                </span>
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {difficultiesFaced}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION: PROJECT SCREENSHOTS */}
      <div className="card-static rounded-2xl p-6 bg-white border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon size={16} className="text-primary-600" />
            <span>Project Screenshots ({files.length})</span>
          </h4>
          {isAdmin && files.length > 0 && onSelectScreenshotForReview && (
            <span className="text-xs text-primary-600 font-medium">
              Click screenshot to load in canvas
            </span>
          )}
        </div>

        {files.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/60 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
            No project screenshots uploaded.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file, idx) => {
              const fullUrl = getFullImageUrl(file.image_url);
              return (
                <div
                  key={file.id || idx}
                  className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-video shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    if (isAdmin && onSelectScreenshotForReview) {
                      onSelectScreenshotForReview(file);
                    } else {
                      setLightboxImg(file.image_url);
                    }
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fullUrl}
                    alt={file.file_name || `Screenshot ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <Maximize2 size={18} />
                    <span className="text-[11px] font-semibold">
                      {isAdmin && onSelectScreenshotForReview ? "Review" : "Expand"}
                    </span>
                  </div>
                  {file.file_name && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-1 truncate">
                      {file.file_name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
