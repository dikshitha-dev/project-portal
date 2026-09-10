"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  LoadingSkeleton,
  Input,
} from "@/components";
import {
  linkedinAPI,
  PostSubmission,
  User,
} from "@/lib/api";
import {
  Linkedin,
  Upload,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Calendar,
  Send,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Check,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Eye,
  Trash2,
  Loader2,
  Layers,
} from "lucide-react";

export default function CandidateLinkedInPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<PostSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<PostSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [draftId, setDraftId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState("LinkedIn");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [postingDate, setPostingDate] = useState("");
  const [postingTime, setPostingTime] = useState("");

  // Uploading & Saving State
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");

  // Selected Submission for Detail Modal
  const [detailModalSubmission, setDetailModalSubmission] = useState<PostSubmission | null>(null);

  // Drag & Drop State
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadIntoEditor = (sub: PostSubmission) => {
    setDraftId(sub.id);
    setCaption(sub.caption || "");
    setPlatform(sub.platform || "LinkedIn");
    setMediaUrls((sub.media || []).map((m) => m.image_url));
    setPostingDate(sub.posting_date || sub.postingDate || "");
    setPostingTime(sub.posting_time || sub.postingTime || "");
    setActiveSubmission(sub);
    setActiveTab("editor");
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await linkedinAPI.candidateGetSubmissions();
      const subs = res.data.submissions || [];
      setSubmissions(subs);

      // If there's an active draft or latest pending/needs changes, load it into editor
      if (subs.length > 0) {
        const latest = subs[0];
        setActiveSubmission(latest);
        if (latest.status === "Draft" || latest.status === "Needs Changes") {
          loadIntoEditor(latest);
        }
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load User & Submissions
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
    fetchSubmissions();
  }, [fetchSubmissions]);

  const resetEditor = () => {
    setDraftId(null);
    setCaption("");
    setPlatform("LinkedIn");
    setMediaUrls([]);
    setPostingDate("");
    setPostingTime("");
    setActiveSubmission(null);
  };

  // -------------------------------------------------------------
  // Real-time AI Guidelines Checker
  // -------------------------------------------------------------
  const guidelineChecks = [
    {
      id: "mentor_tag",
      label: "Mentions Mentor or Team (@...)",
      passed: /@\w+/.test(caption),
    },
    {
      id: "project_link",
      label: "Includes Project or Demo link (http...)",
      passed: /https?:\/\/[^\s]+/.test(caption),
    },
    {
      id: "hashtags",
      label: "Uses professional hashtags (#...)",
      passed: /#\w+/.test(caption),
    },
    {
      id: "length",
      label: "Descriptive announcement (at least 80 characters)",
      passed: caption.trim().length >= 80,
    },
  ];

  const guidelinesScore = guidelineChecks.filter((g) => g.passed).length;

  // -------------------------------------------------------------
  // Auto-Save Draft
  // -------------------------------------------------------------
  useEffect(() => {
    if (!caption.trim() && mediaUrls.length === 0) return;
    if (activeSubmission && (activeSubmission.status === "Pending Review" || activeSubmission.status === "Approved")) {
      return; // Do not auto-save over approved or pending posts
    }

    setAutoSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const res = await linkedinAPI.saveDraft({
          id: draftId || undefined,
          caption,
          platform,
          media_urls: mediaUrls,
          posting_date: postingDate || undefined,
          posting_time: postingTime || undefined,
        });
        if (!draftId && res.data.submission) {
          setDraftId(res.data.submission.id);
        }
        setAutoSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed:", err);
        setAutoSaveStatus("unsaved");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [caption, mediaUrls, postingDate, postingTime, platform, draftId, activeSubmission]);

  // -------------------------------------------------------------
  // Image Upload Handler
  // -------------------------------------------------------------
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.name.match(/\.(jpg|jpeg|png|webp)$/i)
    );
    if (fileArray.length === 0) return;

    if (mediaUrls.length + fileArray.length > 5) {
      alert("Maximum 5 images allowed per submission.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      fileArray.forEach((file) => formData.append("images", file));

      const res = await linkedinAPI.uploadMedia(formData);
      if (res.data.urls) {
        setMediaUrls((prev) => [...prev, ...res.data.urls]);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to upload images.";
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setMediaUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // -------------------------------------------------------------
  // Submit for Approval / Resubmit
  // -------------------------------------------------------------
  const handleSubmitForApproval = async () => {
    if (!caption.trim()) {
      alert("Please write a post caption before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (activeSubmission && activeSubmission.status === "Needs Changes") {
        // Resubmission flow
        res = await linkedinAPI.resubmit(activeSubmission.id, {
          caption: caption.trim(),
          platform,
          media_urls: mediaUrls,
          posting_date: postingDate || undefined,
          posting_time: postingTime || undefined,
        });
      } else {
        // Initial submission
        res = await linkedinAPI.submitForApproval({
          id: draftId || undefined,
          caption: caption.trim(),
          platform,
          media_urls: mediaUrls,
          posting_date: postingDate || undefined,
          posting_time: postingTime || undefined,
        });
      }

      if (res.data.submission) {
        setActiveSubmission(res.data.submission);
        setDraftId(res.data.submission.id);
      }
      fetchSubmissions();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to submit post for approval.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper date formatter
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
    <AuthGuard requiredRole="candidate">
      <AppLayout>
        <div className="space-y-8 max-w-6xl mx-auto pb-16">
          {/* Header & Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary-100/60">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Linkedin size={22} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    LinkedIn Post Studio
                  </h1>
                  <p className="text-gray-500 text-xs font-medium">
                    Draft, verify guidelines, and submit announcements for mentor approval
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Switcher Tabs */}
            <div className="flex items-center p-1 bg-gray-100/90 rounded-2xl border border-gray-200/80 shadow-inner">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "editor"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Post Studio & Editor
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "history"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>Submission History</span>
                {submissions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">
                    {submissions.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {activeTab === "editor" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Cols: Editor & Media */}
              <div className="lg:col-span-2 space-y-6">
                {/* SECTION 1 — Write & Check Your Draft */}
                <div className="card-static bg-white/90 backdrop-blur-xl border border-primary-100/80 rounded-3xl p-6 shadow-glass space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={18} className="text-primary-600" />
                        <span>Write & Check Your Draft</span>
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Paste your LinkedIn announcement below. The AI checks it against the program guidelines while you type.
                      </p>
                    </div>

                    {/* Auto-Save Indicator */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      {autoSaveStatus === "saving" ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-primary-500" />
                          <span>Saving draft...</span>
                        </>
                      ) : autoSaveStatus === "saved" ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-emerald-600 font-semibold">Draft saved</span>
                        </>
                      ) : (
                        <span className="text-amber-600">Unsaved changes</span>
                      )}
                    </div>
                  </div>

                  {/* Textarea with Character Counter */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <textarea
                        rows={7}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write your LinkedIn project post or announcement here... (e.g. 'Thrilled to share my latest project with @mentor...')"
                        className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-y leading-relaxed font-sans"
                        maxLength={3000}
                      />
                      <div className="absolute bottom-3 right-3 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/90 border border-gray-200 text-gray-500 shadow-sm">
                        {caption.length} / 3000
                      </div>
                    </div>
                  </div>

                  {/* AI Guidelines Compliance Checklist */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50/50 to-indigo-50/30 border border-primary-100/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-primary-600 animate-pulse" />
                        <span className="text-xs font-bold text-gray-800">
                          AI Program Guidelines Check
                        </span>
                      </div>
                      <span className="text-xs font-bold text-primary-700 bg-white px-2 py-0.5 rounded-full border border-primary-200">
                        {guidelinesScore} / {guidelineChecks.length} Passed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {guidelineChecks.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            item.passed
                              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800 font-medium"
                              : "bg-white/60 border-gray-200 text-gray-500"
                          }`}
                        >
                          {item.passed ? (
                            <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle size={15} className="text-gray-400 flex-shrink-0" />
                          )}
                          <span className="truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION 2 — Platform & Media */}
                <div className="card-static bg-white/90 backdrop-blur-xl border border-primary-100/80 rounded-3xl p-6 shadow-glass space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ImageIcon size={18} className="text-primary-600" />
                      <span>Add Your Platform & Media</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select your target social platform and attach high-resolution project screenshots.
                    </p>
                  </div>

                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Platform
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPlatform("LinkedIn")}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all shadow-sm ${
                          platform === "LinkedIn"
                            ? "bg-[#0A66C2] text-white border-[#0A66C2] shadow-blue-500/20"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Linkedin size={16} />
                        <span>LinkedIn (Official Default)</span>
                      </button>
                    </div>
                  </div>

                  {/* Drag & Drop Image Upload Zone */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Image Upload (Max 5, JPG / PNG)
                      </label>
                      <span className="text-xs font-semibold text-gray-500">
                        {mediaUrls.length} / 5 uploaded
                      </span>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isDragOver
                          ? "border-primary-500 bg-primary-50/50 scale-[1.01]"
                          : "border-gray-200 hover:border-primary-300 bg-gray-50/50 hover:bg-white"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) handleFiles(e.target.files);
                        }}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mb-1">
                        {uploading ? (
                          <Loader2 size={24} className="animate-spin" />
                        ) : (
                          <Upload size={24} />
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-800">
                        {uploading
                          ? "Uploading images..."
                          : "Drag & Drop images here, or click to browse"}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Supports high-resolution PNG, JPG, WEBP (Up to 5 images)
                      </p>
                    </div>

                    {/* Uploaded Images Thumbnails Grid */}
                    {mediaUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                        {mediaUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 shadow-sm"
                          >
                            <img
                              src={url}
                              alt={`Media ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(idx);
                                }}
                                className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm"
                                title="Remove Image"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-white text-[9px] font-mono">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Optional Posting Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Target Posting Date (Optional)
                      </label>
                      <Input
                        type="date"
                        value={postingDate}
                        onChange={(e) => setPostingDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Target Posting Time (Optional)
                      </label>
                      <Input
                        type="time"
                        value={postingTime}
                        onChange={(e) => setPostingTime(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: SECTION 3 — Submit & Interactive Status Cards */}
              <div className="space-y-6">
                {/* DYNAMIC STATUS CARD BASED ON CURRENT SUBMISSION */}
                {activeSubmission?.status === "Approved" ? (
                  /* APPROVED CARD */
                  <div className="card-static bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border-2 border-emerald-400 rounded-3xl p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Approved
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A66C2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        <Linkedin size={13} />
                        <span>LinkedIn</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900">
                        Ready to Post!
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Congratulations! Your LinkedIn announcement post has been approved by your mentor.
                      </p>
                    </div>

                    {/* Metadata & Posting Schedule */}
                    <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-1.5 text-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Submitted:</span>
                        <span className="font-semibold">{formatDate(activeSubmission.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reviewed:</span>
                        <span className="font-semibold text-emerald-800">
                          {formatDate(activeSubmission.latest_review?.reviewed_at || activeSubmission.updated_at)}
                        </span>
                      </div>
                      {(activeSubmission.posting_date || activeSubmission.postingDate) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Posting Schedule:</span>
                          <span className="font-semibold">
                            {activeSubmission.posting_date || activeSubmission.postingDate}{" "}
                            {activeSubmission.posting_time || activeSubmission.postingTime}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Green Timeline Indicator */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-100/60 text-emerald-800 text-xs font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Ready for live publishing on LinkedIn</span>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => setDetailModalSubmission(activeSubmission)}
                        className="btn-secondary w-full py-2.5 rounded-xl text-xs font-bold"
                      >
                        View Full Details & Timeline
                      </button>
                      <button
                        onClick={resetEditor}
                        className="text-xs text-center text-primary-600 hover:text-primary-800 font-semibold underline mt-1"
                      >
                        + Draft a New Announcement
                      </button>
                    </div>
                  </div>
                ) : activeSubmission?.status === "Needs Changes" ? (
                  /* NEEDS CHANGES CARD */
                  <div className="card-static bg-gradient-to-br from-red-500/10 via-white to-red-500/5 border-2 border-red-400 rounded-3xl p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-sm">
                        <AlertCircle size={14} className="text-red-600" />
                        Needs Changes
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A66C2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        <Linkedin size={13} />
                        <span>LinkedIn</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900">
                        Mentor Feedback Provided
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Please review the feedback below, make the necessary revisions in the editor, and resubmit.
                      </p>
                    </div>

                    {/* Mandatory Visible Feedback Box */}
                    <div className="p-4 bg-red-50/90 border border-red-300 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                          Admin Feedback
                        </span>
                        <span className="text-[10px] text-red-700">
                          {formatDate(activeSubmission.latest_review?.reviewed_at)}
                        </span>
                      </div>
                      <p className="text-xs text-red-900 font-medium italic leading-relaxed">
                        &ldquo;{activeSubmission.latest_review?.feedback || "Please revise announcement details."}&rdquo;
                      </p>
                    </div>

                    {/* Candidate Actions */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleSubmitForApproval}
                        disabled={submitting}
                        className="btn-primary w-full py-3 rounded-2xl text-xs font-bold shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {submitting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={15} />
                        )}
                        <span>Resubmit For Approval</span>
                      </button>

                      <p className="text-[11px] text-center text-gray-400">
                        Your manager will be notified of your revised post.
                      </p>
                    </div>
                  </div>
                ) : activeSubmission?.status === "Pending Review" ? (
                  /* PENDING REVIEW CARD */
                  <div className="card-static bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border-2 border-amber-400 rounded-3xl p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Pending Review
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A66C2] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        <Linkedin size={13} />
                        <span>LinkedIn</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900">
                        Waiting for Mentor Review
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Your post has been submitted and is in the review queue.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-1.5 text-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Submitted:</span>
                        <span className="font-semibold">{formatDate(activeSubmission.created_at)}</span>
                      </div>
                      {(activeSubmission.posting_date || activeSubmission.postingDate) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Posting Schedule:</span>
                          <span className="font-semibold">
                            {activeSubmission.posting_date || activeSubmission.postingDate}{" "}
                            {activeSubmission.posting_time || activeSubmission.postingTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-100/60 text-amber-800 text-xs font-semibold">
                      <Clock size={15} className="text-amber-600 animate-spin" />
                      <span>Review in progress. You will receive a notification when evaluated.</span>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => setDetailModalSubmission(activeSubmission)}
                        className="btn-secondary w-full py-2.5 rounded-xl text-xs font-bold"
                      >
                        View Details & Timeline
                      </button>
                      <button
                        onClick={resetEditor}
                        className="text-xs text-center text-primary-600 hover:text-primary-800 font-semibold underline mt-1"
                      >
                        + Create another draft
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SECTION 3 — INITIAL SUBMIT CARD (No review requested / Draft) */
                  <div className="card-static bg-white/90 backdrop-blur-xl border border-primary-100/80 rounded-3xl p-6 shadow-glass space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Submission Status
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        No review requested
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-gray-900">
                        Submit For Approval
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Once you submit, your manager will be notified to review this post. Status will change to Pending Review.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmitForApproval}
                        disabled={submitting || !caption.trim()}
                        className="btn-primary w-full py-3.5 rounded-2xl text-sm font-bold shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        <span>Submit For Approval</span>
                      </motion.button>

                      <p className="text-[11px] text-center text-gray-400 leading-normal">
                        Your manager will be notified to review this post.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SUBMISSION HISTORY TAB */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    My Submissions History
                  </h2>
                  <p className="text-xs text-gray-500">
                    Track the lifecycle of your LinkedIn announcement drafts and reviews
                  </p>
                </div>
                <button
                  onClick={resetEditor}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Draft New Post</span>
                </button>
              </div>

              {submissions.length === 0 ? (
                <div className="card-static text-center py-16 text-gray-400 text-sm">
                  No submissions yet. Start drafting your first LinkedIn announcement!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {submissions.map((sub) => {
                    const status = sub.status || "Draft";
                    const isApproved = status === "Approved";
                    const isPending = status === "Pending Review";
                    const isNeedsChanges = status === "Needs Changes";

                    return (
                      <div
                        key={sub.id}
                        className={`card-static bg-white/90 border rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all hover:shadow-md ${
                          isApproved
                            ? "border-emerald-200"
                            : isNeedsChanges
                            ? "border-red-200"
                            : isPending
                            ? "border-amber-200"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top Badges */}
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A66C2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <Linkedin size={12} />
                              <span>{sub.platform || "LinkedIn"}</span>
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : isNeedsChanges
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : isPending
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-gray-100 text-gray-700 border-gray-300"
                              }`}
                            >
                              {isApproved && <CheckCircle2 size={12} />}
                              {isNeedsChanges && <AlertCircle size={12} />}
                              {isPending && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              )}
                              <span>{status}</span>
                            </span>
                          </div>

                          {/* Caption Preview */}
                          <p className="text-xs text-gray-800 line-clamp-3 leading-relaxed font-sans min-h-[3rem]">
                            {sub.caption || (
                              <span className="italic text-gray-400">
                                Empty caption draft.
                              </span>
                            )}
                          </p>

                          {/* Images Preview */}
                          {sub.media && sub.media.length > 0 && (
                            <div className="flex items-center gap-1.5 overflow-hidden py-1">
                              {sub.media.slice(0, 3).map((m, i) => (
                                <img
                                  key={i}
                                  src={m.image_url}
                                  alt="Preview"
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                />
                              ))}
                              {sub.media.length > 3 && (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                  +{sub.media.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Admin Feedback snippet if Needs Changes */}
                          {isNeedsChanges && sub.latest_review?.feedback && (
                            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-900 line-clamp-2 italic">
                              &ldquo;{sub.latest_review.feedback}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Card Footer & Action */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                          <span>{formatDate(sub.created_at)}</span>
                          <button
                            onClick={() => {
                              if (isNeedsChanges || status === "Draft") {
                                loadIntoEditor(sub);
                              } else {
                                setDetailModalSubmission(sub);
                              }
                            }}
                            className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                          >
                            <span>{isNeedsChanges ? "Edit & Resubmit" : "View Details"}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DETAILS & TIMELINE MODAL */}
        <AnimatePresence>
          {detailModalSubmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-white">
                  <div className="flex items-center gap-2">
                    <Linkedin size={20} className="text-[#0A66C2]" />
                    <h3 className="font-bold text-gray-900 text-base">
                      Submission Details & Review History
                    </h3>
                  </div>
                  <button
                    onClick={() => setDetailModalSubmission(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
                    <span className="text-xs font-bold text-gray-600">Status:</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-100 text-primary-800">
                      {detailModalSubmission.status}
                    </span>
                  </div>

                  {/* Caption */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Caption
                    </label>
                    <div className="p-4 bg-gray-50/80 rounded-2xl text-xs text-gray-800 leading-relaxed whitespace-pre-wrap border border-gray-200">
                      {detailModalSubmission.caption}
                    </div>
                  </div>

                  {/* Media Gallery */}
                  {detailModalSubmission.media && detailModalSubmission.media.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Attached Images ({detailModalSubmission.media.length})
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {detailModalSubmission.media.map((m, idx) => (
                          <img
                            key={idx}
                            src={m.image_url}
                            alt="Media"
                            className="w-full h-24 object-cover rounded-xl border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Feedback if available */}
                  {detailModalSubmission.latest_review?.feedback && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-1 text-xs">
                      <span className="font-bold text-red-900 block">Mentor Feedback:</span>
                      <p className="text-red-800 italic">
                        &ldquo;{detailModalSubmission.latest_review.feedback}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Audit Timeline */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={14} className="text-primary-600" />
                      <span>Review History Timeline</span>
                    </h4>

                    <div className="relative pl-6 space-y-4 border-l-2 border-primary-100">
                      {(detailModalSubmission.activities || []).map((act, i) => (
                        <div key={i} className="relative text-xs space-y-0.5">
                          <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-primary-600 ring-4 ring-white" />
                          <p className="font-bold text-gray-900">{act.action}</p>
                          <p className="text-gray-500 text-[11px]">
                            {act.details || `Logged by ${act.actor_name || "System"}`}
                          </p>
                          <span className="text-[10px] text-gray-400 block">
                            {formatDate(act.created_at || act.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AppLayout>
    </AuthGuard>
  );
}
