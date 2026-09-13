"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  LoadingSkeleton,
  SearchInput,
} from "@/components";
import { projectsAPI, ProjectJoinRequest, Project } from "@/lib/api";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Check,
  X,
  MessageSquare,
  Loader2,
  FolderKanban,
  KeyRound,
  Globe,
  Filter,
} from "lucide-react";

export default function AdminJoinRequestsPage() {
  const [requests, setRequests] = useState<ProjectJoinRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [feedbackToast, setFeedbackToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchAllRequestsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectsAPI.getAll();
      const allProjs = res.data.projects || [];
      setProjects(allProjs);

      const aggregatedRequests: ProjectJoinRequest[] = [];
      allProjs.forEach((proj) => {
        if (proj.join_requests && proj.join_requests.length > 0) {
          proj.join_requests.forEach((req) => {
            aggregatedRequests.push({
              ...req,
              project_id: proj.id,
              project_name: proj.name,
            });
          });
        }
      });

      // Sort pending first, then by date descending
      aggregatedRequests.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime();
      });

      setRequests(aggregatedRequests);
    } catch (err) {
      console.error("Failed to load join requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRequestsData();
  }, [fetchAllRequestsData]);

  const handleAccept = async (req: ProjectJoinRequest) => {
    setActionBusy(req.id);
    setFeedbackToast(null);
    try {
      await projectsAPI.acceptJoinRequest(req.project_id, req.id);
      setFeedbackToast({
        type: "success",
        message: `Accepted ${req.user?.name || "Candidate"}'s join request for ${req.project_name || "Project"}!`,
      });
      await fetchAllRequestsData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to accept request.";
      setFeedbackToast({ type: "error", message: msg });
    } finally {
      setActionBusy(null);
    }
  };

  const handleReject = async (req: ProjectJoinRequest) => {
    setActionBusy(req.id);
    setFeedbackToast(null);
    const remark = remarksMap[req.id]?.trim() || "";
    try {
      await projectsAPI.rejectJoinRequest(req.project_id, req.id, remark || undefined);
      setFeedbackToast({
        type: "success",
        message: `Rejected join request for ${req.project_name || "Project"}.`,
      });
      await fetchAllRequestsData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to reject request.";
      setFeedbackToast({ type: "error", message: msg });
    } finally {
      setActionBusy(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const candName = r.user?.name?.toLowerCase() || "";
    const candEmail = r.user?.email?.toLowerCase() || "";
    const projName = r.project_name?.toLowerCase() || "";
    return candName.includes(q) || candEmail.includes(q) || projName.includes(q);
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const formatDate = (iso?: string) => {
    if (!iso) return "Recently";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary-100/60">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <span>Join Requests</span>
                {pendingCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    {pendingCount} Pending
                  </span>
                )}
              </h1>
              <p className="text-gray-500 text-sm mt-1 font-medium">
                Review candidate requests to access public and private project workspaces
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-gray-100/80 rounded-2xl border border-gray-200/80 shadow-inner">
              {(["pending", "approved", "rejected", "all"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    statusFilter === st
                      ? "bg-white text-primary-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span>{st}</span>
                  {st === "pending" && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Toast */}
          <AnimatePresence>
            {feedbackToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold border shadow-sm ${
                  feedbackToast.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedbackToast.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span>{feedbackToast.message}</span>
                </div>
                <button onClick={() => setFeedbackToast(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Bar */}
          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search candidate name, email, or project..."
            />
          </div>

          {/* Main Requests Cards List */}
          {loading ? (
            <div className="py-12">
              <LoadingSkeleton rows={4} />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="card-static text-center py-20 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-3xl bg-white/70">
              <Clock size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-800 text-base">No join requests found</h3>
              <p className="text-xs text-gray-400 mt-1">
                {statusFilter === "pending"
                  ? "There are no pending join requests awaiting mentor approval."
                  : "No join requests matching the selected filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((req) => {
                const isPending = req.status === "pending";
                const isApproved = req.status === "approved";
                const isRejected = req.status === "rejected";

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card-static bg-white/95 backdrop-blur-md rounded-2xl border p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                      isApproved
                        ? "border-emerald-200/80"
                        : isRejected
                        ? "border-red-200/80"
                        : "border-amber-300/90 shadow-amber-500/5 ring-1 ring-amber-200/60"
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Row: Status & Joined Via Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : isRejected
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {isApproved && <CheckCircle2 size={12} />}
                          {isRejected && <AlertCircle size={12} />}
                          {isPending && <Clock size={12} className="animate-spin text-amber-600" />}
                          <span className="capitalize">{req.status}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          <KeyRound size={11} className="text-gray-400" />
                          <span>{req.joined_via === "invite" ? "Invite Code" : "Public Request"}</span>
                        </span>
                      </div>

                      {/* Candidate Details */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                          {(req.user?.name || "C")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {req.user?.name || "Candidate"}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {req.user?.email || "No email provided"}
                          </p>
                        </div>
                      </div>

                      {/* Project Name */}
                      <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Target Project
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                          <FolderKanban size={14} className="text-primary-600" />
                          <span>{req.project_name || "Project Workspace"}</span>
                        </div>
                      </div>

                      {/* Requested Time */}
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Requested: {formatDate(req.created_at)}</span>
                      </div>

                      {/* Optional Feedback Remark Input for Rejection/Acceptance */}
                      {isPending && (
                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span>Optional Remark / Feedback:</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Add remark for candidate..."
                            value={remarksMap[req.id] || ""}
                            onChange={(e) => setRemarksMap({ ...remarksMap, [req.id]: e.target.value })}
                            className="w-full text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary-500"
                          />
                        </div>
                      )}

                      {/* Remark display if already reviewed */}
                      {req.feedback && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800">
                          <strong>Remark:</strong> {req.feedback}
                        </div>
                      )}
                    </div>

                    {/* Actions: Accept & Reject Buttons */}
                    {isPending ? (
                      <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleReject(req)}
                          disabled={actionBusy === req.id}
                          className="btn-secondary py-2 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {actionBusy === req.id && <Loader2 size={12} className="animate-spin" />}
                          <X size={14} />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleAccept(req)}
                          disabled={actionBusy === req.id}
                          className="btn-primary py-2 px-3 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {actionBusy === req.id && <Loader2 size={12} className="animate-spin" />}
                          <Check size={14} />
                          <span>Accept</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
                        Reviewed: {req.reviewed_at ? formatDate(req.reviewed_at) : "Recently"}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
