"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  LoadingSkeleton,
  SearchInput,
} from "@/components";
import {
  linkedinAPI,
  PostSubmission,
  User,
} from "@/lib/api";
import {
  Linkedin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  Loader2,
  Calendar,
  UserCheck,
  UserX,
  Eye,
  Sparkles,
  ArrowLeft,
  Check,
  Image as ImageIcon,
} from "lucide-react";

export default function AdminLinkedInReviewPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<PostSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected Submission for 3-Column Review
  const [selectedSubmission, setSelectedSubmission] = useState<PostSubmission | null>(null);

  // Review Panel Form State
  const [decision, setDecision] = useState<"Approved" | "Needs Changes" | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Active Lightbox image
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async (filter?: string) => {
    try {
      setLoading(true);
      const activeF = filter !== undefined ? filter : statusFilter;
      const res = await linkedinAPI.adminGetSubmissions(activeF === "All" ? undefined : activeF);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("Failed to load admin submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleStatusFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    fetchSubmissions(newFilter);
  };

  // Open 3-Column Review Interface
  const openReview = async (sub: PostSubmission) => {
    setSelectedSubmission(sub);
    setDecision(null);
    setFeedback("");
    setReviewError("");

    // Automatically log "Viewed by admin" in timeline
    try {
      await linkedinAPI.adminMarkViewed(sub.id);
      // Reload single submission to reflect the view activity
      const refreshed = await linkedinAPI.getSubmission(sub.id);
      setSelectedSubmission(refreshed.data.submission);
    } catch (err) {
      console.error("Failed to mark viewed:", err);
    }
  };

  // Submit Review
  const handleReviewSubmit = async () => {
    if (!selectedSubmission || !decision) {
      setReviewError("Please choose to Approve or Request Changes.");
      return;
    }

    if (decision === "Needs Changes" && !feedback.trim()) {
      setReviewError("Feedback is mandatory when requesting changes.");
      return;
    }

    setReviewBusy(true);
    setReviewError("");
    try {
      const res = await linkedinAPI.adminReviewSubmission(selectedSubmission.id, {
        decision,
        feedback: feedback.trim() || undefined,
      });

      // Update state
      const updated = res.data.submission;
      setSelectedSubmission(updated);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setDecision(null);
      setFeedback("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to submit review.";
      setReviewError(msg);
    } finally {
      setReviewBusy(false);
    }
  };

  // Filtered submissions in memory by search query
  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const candName = s.user?.name?.toLowerCase() || "";
    const candEmail = s.user?.email?.toLowerCase() || "";
    const cap = s.caption?.toLowerCase() || "";
    return candName.includes(q) || candEmail.includes(q) || cap.includes(q);
  });

  // Count pending reviews
  const pendingCount = submissions.filter((s) => s.status === "Pending Review").length;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary-100/60">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Linkedin size={22} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    LinkedIn Review Workspace
                  </h1>
                  <p className="text-gray-500 text-xs font-medium">
                    Inspect announcements, verify guidelines, and approve or request changes
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
                <Clock size={13} className="text-amber-600" />
                <span>{pendingCount} Pending Review</span>
              </span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status Filter Pills */}
            <div className="flex items-center p-1 bg-gray-100/80 rounded-2xl border border-gray-200/80 shadow-inner overflow-x-auto max-w-full">
              {["All", "Pending Review", "Needs Changes", "Approved", "Draft"].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusFilterChange(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? "bg-white text-primary-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span>{st}</span>
                  {st === "Pending Review" && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search candidate or caption..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery("")}
              />
            </div>
          </div>

          {/* Submissions List / Queue */}
          {loading ? (
            <div className="py-12">
              <LoadingSkeleton rows={4} />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="card-static text-center py-20 text-gray-400 text-sm">
              No submissions found for the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((sub) => {
                const status = sub.status || "Draft";
                const isApproved = status === "Approved";
                const isPending = status === "Pending Review";
                const isNeedsChanges = status === "Needs Changes";

                return (
                  <div
                    key={sub.id}
                    onClick={() => openReview(sub)}
                    className={`card-static bg-white/90 border rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer hover:border-primary-300 ${
                      isApproved
                        ? "border-emerald-200/80"
                        : isNeedsChanges
                        ? "border-red-200/80"
                        : isPending
                        ? "border-amber-300/80 shadow-amber-500/5 ring-1 ring-amber-200"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Candidate Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {(sub.user?.name || "C")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {sub.user?.name || "Candidate"}
                            </h4>
                            <p className="text-[11px] text-gray-500 truncate">
                              {sub.user?.email}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0 ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : isNeedsChanges
                              ? "bg-red-100 text-red-800 border-red-300"
                              : isPending
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {isApproved && <CheckCircle2 size={11} />}
                          {isNeedsChanges && <AlertCircle size={11} />}
                          {isPending && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                          <span>{status}</span>
                        </span>
                      </div>

                      {/* Caption Preview */}
                      <p className="text-xs text-gray-800 line-clamp-3 leading-relaxed font-sans min-h-[3rem]">
                        {sub.caption || (
                          <span className="italic text-gray-400">Empty caption.</span>
                        )}
                      </p>

                      {/* Media Thumbnails */}
                      {sub.media && sub.media.length > 0 && (
                        <div className="flex items-center gap-1.5 py-1">
                          {sub.media.slice(0, 3).map((m, i) => (
                            <img
                              key={i}
                              src={m.image_url}
                              alt="Thumbnail"
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                          {sub.media.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                              +{sub.media.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Submitted: {formatDate(sub.created_at)}</span>
                      <button className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1">
                        <span>Review</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3-COLUMN REVIEW MODAL / CONSOLE */}
          <AnimatePresence>
            {selectedSubmission && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 15 }}
                  className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-primary-100 overflow-hidden max-h-[92vh] flex flex-col"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/60 via-white to-primary-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-sm">
                        <Linkedin size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          <span>Review Announcement</span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              selectedSubmission.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : selectedSubmission.status === "Needs Changes"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : selectedSubmission.status === "Pending Review"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            {selectedSubmission.status}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500">
                          Candidate: {selectedSubmission.user?.name} ({selectedSubmission.user?.email})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* 3-COLUMN LAYOUT */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1">
                    {/* LEFT COLUMN (3 Cols) — Candidate Profile & Metadata */}
                    <div className="lg:col-span-3 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 lg:pr-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Candidate Profile
                      </h4>

                      {/* Profile Card */}
                      <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-primary-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                            {(selectedSubmission.user?.name || "C")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-gray-900 truncate">
                              {selectedSubmission.user?.name || "Candidate"}
                            </h5>
                            <p className="text-xs text-gray-500 truncate">
                              {selectedSubmission.user?.email}
                            </p>
                            <span className="inline-block text-[10px] font-semibold text-primary-700 uppercase tracking-wider mt-0.5">
                              {selectedSubmission.user?.role || "Candidate"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Platform & Timing Details */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                            Target Platform
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0A66C2] text-white shadow-sm">
                            <Linkedin size={14} />
                            <span>{selectedSubmission.platform || "LinkedIn"}</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-0.5">
                            Submission Time
                          </span>
                          <span className="text-xs font-semibold text-gray-800">
                            {formatDate(selectedSubmission.created_at)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-gray-500 uppercase block mb-0.5">
                            Target Posting Schedule
                          </span>
                          <span className="text-xs font-semibold text-gray-800">
                            {selectedSubmission.posting_date || selectedSubmission.postingDate ? (
                              `${selectedSubmission.posting_date || selectedSubmission.postingDate} at ${
                                selectedSubmission.posting_time || selectedSubmission.postingTime || "Anytime"
                              }`
                            ) : (
                              <span className="text-gray-400 italic">No specific schedule set</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CENTER COLUMN (5 Cols) — Caption & Media Preview */}
                    <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 lg:pr-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Post Content & Media
                      </h4>

                      {/* Full Caption */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">
                          Caption Text
                        </label>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-900 leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto">
                          {selectedSubmission.caption}
                        </div>
                      </div>

                      {/* Media Images Gallery */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-700">
                            Attached Media ({selectedSubmission.media?.length || 0})
                          </label>
                          <span className="text-[11px] text-gray-400">Click to enlarge</span>
                        </div>

                        {selectedSubmission.media && selectedSubmission.media.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {selectedSubmission.media.map((m, idx) => (
                              <div
                                key={idx}
                                onClick={() => setActiveLightboxImg(m.image_url)}
                                className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 shadow-sm cursor-pointer group hover:scale-[1.02] transition-transform"
                              >
                                <img
                                  src={m.image_url}
                                  alt="Attached"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye size={18} className="text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            No media attached to this post.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN (4 Cols) — Review Panel & Actions */}
                    <div className="lg:col-span-4 space-y-5">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Review Panel & Decision
                      </h4>

                      {/* Action Decision Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDecision("Approved")}
                          className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                            decision === "Approved"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20"
                              : "bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          <CheckCircle2 size={16} />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecision("Needs Changes")}
                          className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                            decision === "Needs Changes"
                              ? "bg-red-600 text-white border-red-600 shadow-red-500/20"
                              : "bg-red-50/80 text-red-800 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          <AlertCircle size={16} />
                          <span>Needs Changes</span>
                        </button>
                      </div>

                      {/* Feedback Textbox */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-700">
                            Mentor Feedback
                          </label>
                          {decision === "Needs Changes" && (
                            <span className="text-[10px] font-bold text-red-600 uppercase">
                              * Mandatory
                            </span>
                          )}
                        </div>

                        <textarea
                          rows={4}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Write detailed feedback for the candidate... (e.g. 'You have already done your announcement post. Please post a different announcement instead.')"
                          className={`w-full p-3 rounded-2xl text-xs border outline-none transition-all resize-y ${
                            decision === "Needs Changes" && !feedback.trim()
                              ? "border-red-300 bg-red-50/30 focus:border-red-500"
                              : "border-gray-200 bg-gray-50/70 focus:border-primary-500 focus:bg-white"
                          }`}
                        />
                      </div>

                      {reviewError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                          <AlertCircle size={14} className="flex-shrink-0" />
                          <span>{reviewError}</span>
                        </div>
                      )}

                      {/* Confirm Review Button */}
                      <button
                        type="button"
                        onClick={handleReviewSubmit}
                        disabled={reviewBusy || !decision}
                        className="btn-primary w-full py-3 rounded-2xl text-xs font-bold shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {reviewBusy ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        <span>
                          {decision
                            ? `Submit ${decision} Decision`
                            : "Select Decision Above"}
                        </span>
                      </button>

                      {/* Chronological Review History Timeline */}
                      <div className="pt-3 border-t border-gray-100 space-y-2.5">
                        <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={13} className="text-primary-600" />
                          <span>Review History Timeline</span>
                        </h5>

                        <div className="relative pl-5 space-y-3.5 border-l-2 border-primary-100 max-h-44 overflow-y-auto pr-1">
                          {(selectedSubmission.activities || []).map((act, idx) => (
                            <div key={idx} className="relative text-xs space-y-0.5">
                              <div className="absolute -left-[27px] top-0.5 w-2.5 h-2.5 rounded-full bg-primary-600 ring-4 ring-white" />
                              <p className="font-bold text-gray-900 leading-tight">
                                {act.action}
                              </p>
                              <p className="text-[11px] text-gray-500 leading-snug">
                                {act.details || `By ${act.actor_name || "System"}`}
                              </p>
                              <span className="text-[10px] text-gray-400 block">
                                {formatDate(act.created_at || act.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* LIGHTBOX FOR ENLARGING IMAGES */}
          <AnimatePresence>
            {activeLightboxImg && (
              <div
                onClick={() => setActiveLightboxImg(null)}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
              >
                <div className="relative max-w-4xl max-h-[90vh]">
                  <img
                    src={activeLightboxImg}
                    alt="Enlarged"
                    className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
                  />
                  <button
                    onClick={() => setActiveLightboxImg(null)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
