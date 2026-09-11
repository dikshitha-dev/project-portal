"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  LoadingSpinner,
  LoadingSkeleton,
  Input,
  Textarea,
} from "@/components";
import {
  Project,
  ProjectMember,
  ProjectJoinRequest,
  Week,
  projectsAPI,
  weeksAPI,
  User,
} from "@/lib/api";
import { authService } from "@/lib/services/auth";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
  Globe,
  Kanban,
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";

export default function ProjectDetailsPage() {
  const router = useRouter();
  const routeParams = useParams();
  const projectId = (routeParams?.id as string) || "";

  const [project, setProject] = useState<Project | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "taskboard">("details");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Access error states
  const [accessError, setAccessError] = useState<{
    status: string;
    message: string;
    projectName?: string;
  } | null>(null);

  // Clipboard copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  // Edit Project Modal
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState({
    name: "",
    description: "",
    public_joining: false,
  });
  const [editProjectBusy, setEditProjectBusy] = useState(false);
  const [editProjectError, setEditProjectError] = useState("");

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberIdentifier, setAddMemberIdentifier] = useState("");
  const [addMemberRole, setAddMemberRole] = useState<"member" | "owner">("member");
  const [addMemberBusy, setAddMemberBusy] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

  // Week Modal (Create / Edit Week inside modal)
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);
  const [weekForm, setWeekForm] = useState({
    week_title: "",
    objective: "",
    resources: "",
    deadline: "",
  });
  const [weekBusy, setWeekBusy] = useState(false);
  const [weekError, setWeekError] = useState("");

  // Deleting week / member / project states
  const [deletingWeekId, setDeletingWeekId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Current user
  useEffect(() => {
    authService.getMe().then(({ user }) => {
      if (user) setCurrentUser(user);
    }).catch(() => {});
  }, []);

  // Fetch Project & Weeks
  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectsAPI.getOne(projectId);
      setProject(res.data.project);

      // Fetch weeks for this project
      const weeksRes = await projectsAPI.getWeeks(projectId);
      const sorted = (weeksRes.data.weeks || []).sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
      setWeeks(sorted);
      setAccessError(null);
    } catch (err: unknown) {
      const errorResp = (err as { response?: { status?: number; data?: { error?: string; status?: string; project_name?: string } } })?.response;
      if (errorResp?.status === 403) {
        setAccessError({
          status: errorResp.data?.status || "not_member",
          message: errorResp.data?.error || "Access Denied. You are not an approved member of this project.",
          projectName: errorResp.data?.project_name,
        });
      } else {
        console.error("Failed to load project:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  const isOwner =
    project?.is_owner ||
    project?.owner_id === currentUser?.id ||
    currentUser?.email === "admin@portal.com";

  // Regenerate Invite Code
  const handleRegenerateCode = async () => {
    if (!project) return;
    setRegeneratingCode(true);
    try {
      const res = await projectsAPI.regenerateCode(project.id);
      setProject((prev) =>
        prev ? { ...prev, invite_code: res.data.invite_code } : null
      );
    } catch (err) {
      console.error("Failed to regenerate invite code:", err);
    } finally {
      setRegeneratingCode(false);
    }
  };

  // Toggle Public Joining
  const handleTogglePublicJoining = async () => {
    if (!project) return;
    try {
      const updatedValue = !project.public_joining;
      const res = await projectsAPI.update(project.id, {
        public_joining: updatedValue,
      });
      setProject((prev) =>
        prev ? { ...prev, public_joining: res.data.project.public_joining } : null
      );
    } catch (err) {
      console.error("Failed to toggle public joining:", err);
    }
  };

  // Copy helpers
  const getInviteLink = () => {
    if (typeof window === "undefined" || !project) return "";
    return `${window.location.origin}/dashboard?join=${project.invite_code}`;
  };

  const handleCopyCode = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = getInviteLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Edit Project
  const openEditModal = () => {
    if (!project) return;
    setEditProjectForm({
      name: project.name,
      description: project.description || "",
      public_joining: project.public_joining,
    });
    setEditProjectError("");
    setShowEditProjectModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!editProjectForm.name.trim()) {
      setEditProjectError("Project name is required.");
      return;
    }

    setEditProjectBusy(true);
    setEditProjectError("");
    try {
      const res = await projectsAPI.update(project.id, {
        name: editProjectForm.name.trim(),
        description: editProjectForm.description.trim(),
        public_joining: editProjectForm.public_joining,
      });
      setProject(res.data.project);
      setShowEditProjectModal(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update project.";
      setEditProjectError(msg);
    } finally {
      setEditProjectBusy(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!project) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this project? All associated weeks and task data will be permanently deleted."
      )
    ) {
      return;
    }

    try {
      await projectsAPI.delete(project.id);
      router.push("/admin/projects");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete project.";
      alert(msg);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !addMemberIdentifier.trim()) return;

    setAddMemberBusy(true);
    setAddMemberError("");
    try {
      await projectsAPI.addMember(project.id, {
        email: addMemberIdentifier.trim(),
        role: addMemberRole,
      });
      setShowAddMemberModal(false);
      setAddMemberIdentifier("");
      loadProjectData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to add member. Check user email/username.";
      setAddMemberError(msg);
    } finally {
      setAddMemberBusy(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;
    if (!window.confirm("Remove this member from the project?")) return;

    setRemovingMemberId(memberId);
    try {
      await projectsAPI.removeMember(project.id, memberId);
      loadProjectData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to remove member.";
      alert(msg);
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Accept / Reject Join Request
  const handleAcceptRequest = async (requestId: string) => {
    if (!project) return;
    setActionBusy(requestId);
    try {
      await projectsAPI.acceptJoinRequest(project.id, requestId);
      await loadProjectData();
    } catch (err) {
      console.error("Failed to accept request:", err);
    } finally {
      setActionBusy(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!project) return;
    const feedback = window.prompt(
      "Optional: Enter feedback or reason for rejection (or leave empty):"
    );
    if (feedback === null) return; // Cancelled
    setActionBusy(requestId);
    try {
      await projectsAPI.rejectJoinRequest(
        project.id,
        requestId,
        feedback.trim() || undefined
      );
      await loadProjectData();
    } catch (err) {
      console.error("Failed to reject request:", err);
    } finally {
      setActionBusy(null);
    }
  };

  // Week Modal Actions (Create / Edit Week)
  const openCreateWeekModal = () => {
    setEditingWeek(null);
    setWeekForm({
      week_title: "",
      objective: "",
      resources: "",
      deadline: "",
    });
    setWeekError("");
    setShowWeekModal(true);
  };

  const openEditWeekModal = (week: Week) => {
    setEditingWeek(week);
    setWeekForm({
      week_title: week.week_title,
      objective: week.objective,
      resources: week.resources || "",
      deadline: week.deadline
        ? new Date(week.deadline).toISOString().split("T")[0]
        : "",
    });
    setWeekError("");
    setShowWeekModal(true);
  };

  const handleSaveWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!weekForm.week_title.trim()) {
      setWeekError("Week title is required.");
      return;
    }
    if (!weekForm.objective.trim()) {
      setWeekError("Objective is required.");
      return;
    }
    if (!weekForm.deadline) {
      setWeekError("Deadline is required.");
      return;
    }

    setWeekBusy(true);
    setWeekError("");
    try {
      if (editingWeek) {
        await weeksAPI.update(editingWeek.id, {
          week_title: weekForm.week_title.trim(),
          objective: weekForm.objective.trim(),
          resources: weekForm.resources.trim() || undefined,
          deadline: weekForm.deadline,
          project_id: project.id,
        });
      } else {
        await weeksAPI.create({
          week_title: weekForm.week_title.trim(),
          objective: weekForm.objective.trim(),
          resources: weekForm.resources.trim() || undefined,
          deadline: weekForm.deadline,
          project_id: project.id,
        });
      }
      setShowWeekModal(false);
      loadProjectData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to save week.";
      setWeekError(msg);
    } finally {
      setWeekBusy(false);
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!window.confirm("Delete this week roadmap? This action cannot be undone.")) {
      return;
    }
    setDeletingWeekId(weekId);
    try {
      await weeksAPI.delete(weekId);
      setWeeks((prev) => prev.filter((w) => w.id !== weekId));
    } catch (err) {
      console.error("Failed to delete week:", err);
    } finally {
      setDeletingWeekId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const dl = new Date(deadline);
    const diffMs = dl.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "Overdue", className: "badge-red" };
    }
    if (diffDays <= 2) {
      return { label: `${diffDays}d left`, className: "badge-yellow" };
    }
    return { label: `${diffDays}d left`, className: "badge-green" };
  };

  // Render Access Denied Screen if unauthorized
  if (accessError) {
    return (
      <AuthGuard requiredRole="admin">
        <AppLayout>
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-static max-w-md w-full text-center p-8 border border-red-200/70 bg-white/90 shadow-xl rounded-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Lock size={32} />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {accessError.status === "pending"
                  ? "Access Pending Approval"
                  : "Private Project Access Denied"}
              </h2>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {accessError.message}
              </p>

              <button
                onClick={() => router.push("/admin/projects")}
                className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold shadow-glow flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Back to Projects Dashboard</span>
              </button>
            </motion.div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (loading || !project) {
    return (
      <AuthGuard requiredRole="admin">
        <AppLayout>
          <div className="py-12 max-w-7xl mx-auto space-y-6">
            <LoadingSkeleton rows={4} />
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  const pendingRequests = project.join_requests || [];

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-primary-100/60">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/projects")}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-primary-600 hover:border-primary-300 shadow-sm transition-all"
                title="Back to Projects"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 uppercase tracking-wider">
                  <span>Projects</span>
                  <span>/</span>
                  <span className="text-gray-500 font-normal">Details</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                  <span>{project.name}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {project.status || "Active"}
                  </span>
                </h1>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 bg-gray-100/80 rounded-xl border border-gray-200/80 shadow-inner">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "details"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileText size={15} />
                <span>Project Details</span>
              </button>
              <button
                onClick={() => setActiveTab("taskboard")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "taskboard"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Kanban size={15} />
                <span>Task Board ({weeks.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: PROJECT DETAILS */}
          {activeTab === "details" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* SECTION A — Project Information */}
              <div className="card-static bg-white/90 backdrop-blur-md rounded-2xl border border-primary-100/80 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-glow">
                        {project.name[0]?.toUpperCase() || "P"}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {project.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1.5 font-medium">
                            <ShieldCheck size={14} className="text-primary-600" />
                            Owner:{" "}
                            <strong className="text-gray-800 font-semibold">
                              {project.owner_name || "Admin"}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            Created {formatDate(project.created_at)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                            <Users size={14} />
                            {project.members_count || 1}{" "}
                            {project.members_count === 1 ? "Member" : "Members"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Description
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">
                        {project.description || (
                          <span className="text-gray-400 italic">
                            No project description provided.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Section A Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 lg:self-start">

                    {isOwner && (
                      <>
                        <button
                          onClick={openEditModal}
                          className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={15} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={handleDeleteProject}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid: Section B & Section C */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SECTION B — Members (2 Cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users size={18} className="text-primary-600" />
                        <span>Project Members</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                          {project.members?.length || 0}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500">
                        People with access to project roadmaps and tasks
                      </p>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => {
                          setAddMemberError("");
                          setAddMemberIdentifier("");
                          setShowAddMemberModal(true);
                        }}
                        className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl shadow-sm"
                      >
                        <Plus size={15} />
                        <span>+ Add Member</span>
                      </button>
                    )}
                  </div>

                  {/* Horizontal Member Cards */}
                  <div className="space-y-2.5">
                    {project.members && project.members.length > 0 ? (
                      project.members.map((member: ProjectMember) => {
                        const isMemberOwner = member.role === "owner";
                        const userName: string =
                          member.user?.name ||
                          (member.user_id === project.owner_id
                            ? project.owner_name || "Admin"
                            : "Member");
                        const userEmail: string =
                          member.user?.email ||
                          (member.user_id === project.owner_id
                            ? project.owner_email || ""
                            : "");

                        return (
                          <div
                            key={member.id}
                            className="card flex items-center justify-between p-4 bg-white/90 rounded-xl border border-gray-200/70 hover:border-primary-200 shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                                {userName[0]?.toUpperCase() || "U"}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {userName}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {userEmail || "No email available"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isMemberOwner
                                    ? "bg-primary-100 text-primary-700 border border-primary-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                }`}
                              >
                                {isMemberOwner ? "Owner" : "Member"}
                              </span>

                              {isOwner && !isMemberOwner && (
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  disabled={removingMemberId === member.id}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                  title="Remove Member"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center bg-gray-50/50 rounded-xl border border-gray-200/60 text-gray-500 text-xs">
                        No members found in this project.
                      </div>
                    )}
                  </div>

                  {/* SECTION D — Pending Join Requests (If Owner) */}
                  {isOwner && (
                    <div className="pt-6 mt-6 border-t border-gray-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Clock size={16} className="text-amber-500" />
                          <span>Pending Join Requests</span>
                          {pendingRequests.length > 0 && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {pendingRequests.length}
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          Approve users before they can access this project
                        </span>
                      </div>

                      {pendingRequests.length > 0 ? (
                        <div className="space-y-2">
                          {pendingRequests.map((req: ProjectJoinRequest) => (
                            <div
                              key={req.id}
                              className="card flex items-center justify-between p-3.5 bg-amber-50/40 border border-amber-200/70 rounded-xl shadow-sm"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                  {(req.user?.name || "U")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {req.user?.name || "Candidate"}
                                  </p>
                                  <p className="text-[11px] text-gray-500 truncate">
                                    {req.user?.email}
                                  </p>
                                  {req.created_at && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      Requested: {formatDate(req.created_at)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleAcceptRequest(req.id)}
                                  disabled={actionBusy === req.id}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                                >
                                  {actionBusy === req.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <UserCheck size={13} />
                                  )}
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  disabled={actionBusy === req.id}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <UserX size={13} />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-100 text-center text-xs text-gray-400">
                          No pending join requests.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION C — Dedicated Invite Card (1 Col) */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Invite People
                    </h3>
                    <p className="text-xs text-gray-500">
                      Share access codes and links with your team
                    </p>
                  </div>

                  <div className="card-static bg-gradient-to-br from-white to-primary-50/30 border border-primary-200/70 rounded-2xl p-6 shadow-sm space-y-6">
                    {/* Status Badge */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Joining Status
                        </span>
                        {project.public_joining ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                            <Globe size={13} className="text-emerald-600" />
                            Public Project
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            <Lock size={13} className="text-gray-500" />
                            Private Project
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 pt-1">
                        {project.public_joining
                          ? "Visible in Discover Projects. Candidates can discover and join directly."
                          : "Hidden from Discover Projects. Candidates join using invite code (requires admin approval)."}
                      </p>
                    </div>

                    {/* Invite Code */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Invite Code
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-mono text-base font-black text-center tracking-widest text-primary-700 shadow-inner">
                          {project.invite_code}
                        </div>
                        <button
                          onClick={handleCopyCode}
                          className="btn-secondary p-2.5 rounded-xl border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 bg-white transition-all shadow-sm"
                          title="Copy Code"
                        >
                          {copiedCode ? (
                            <Check size={18} className="text-emerald-600" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Copy Direct Invite Link Button (No raw localhost link input box) */}
                    <div>
                      <button
                        onClick={handleCopyLink}
                        className="w-full py-2.5 px-3 text-xs font-semibold text-primary-700 hover:text-primary-800 bg-white hover:bg-primary-50/60 border border-primary-200 hover:border-primary-300 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        {copiedLink ? (
                          <>
                            <Check size={15} className="text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Invite Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={15} />
                            <span>Copy Direct Invite Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Actions: Regenerate & Toggle */}
                    {isOwner && (
                      <div className="pt-4 border-t border-gray-200/70 space-y-3">
                        <button
                          onClick={handleRegenerateCode}
                          disabled={regeneratingCode}
                          className="w-full py-2 px-3 text-xs font-semibold text-gray-700 hover:text-primary-700 bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-200 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                        >
                          <RefreshCw
                            size={14}
                            className={regeneratingCode ? "animate-spin" : ""}
                          />
                          <span>Regenerate Code</span>
                        </button>

                        <button
                          onClick={handleTogglePublicJoining}
                          className={`w-full py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border transition-all ${
                            project.public_joining
                              ? "bg-amber-50/80 hover:bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {project.public_joining ? (
                            <>
                              <Lock size={14} />
                              <span>Make Project Private</span>
                            </>
                          ) : (
                            <>
                              <Globe size={14} />
                              <span>Make Project Public</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* MODAL: Edit Project Modal */}
        <AnimatePresence>
          {showEditProjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-primary-100 overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                      <Pencil size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Edit Project
                      </h2>
                      <p className="text-xs text-gray-500">
                        Update project details and settings
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditProjectModal(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveProject} className="p-6 space-y-5">
                  {editProjectError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{editProjectError}</span>
                    </div>
                  )}

                  <Input
                    label="Project Name"
                    required
                    value={editProjectForm.name}
                    onChange={(e) =>
                      setEditProjectForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />

                  <Textarea
                    label="Project Description"
                    rows={3}
                    value={editProjectForm.description}
                    onChange={(e) =>
                      setEditProjectForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />

                  {/* Public Joining Toggle */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Public Joining
                      </span>
                      <span className="text-[11px] text-gray-500 block max-w-xs">
                        Allow users with invite code to request to join this project.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditProjectForm((p) => ({
                          ...p,
                          public_joining: !p.public_joining,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        editProjectForm.public_joining
                          ? "bg-primary-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editProjectForm.public_joining
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowEditProjectModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editProjectBusy}
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-60"
                    >
                      {editProjectBusy && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: Add Member Modal */}
        <AnimatePresence>
          {showAddMemberModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-primary-100 overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Add Project Member
                      </h2>
                      <p className="text-xs text-gray-500">
                        Directly add an existing candidate or admin by email
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddMemberModal(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="p-6 space-y-4">
                  {addMemberError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{addMemberError}</span>
                    </div>
                  )}

                  <Input
                    label="Candidate Email or Username"
                    required
                    placeholder="e.g. candidate@portal.com or dikshitha"
                    value={addMemberIdentifier}
                    onChange={(e) => setAddMemberIdentifier(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Project Role
                    </label>
                    <select
                      value={addMemberRole}
                      onChange={(e) =>
                        setAddMemberRole(e.target.value as "member" | "owner")
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <option value="member">Member</option>
                      <option value="owner">Owner (Admin)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addMemberBusy || !addMemberIdentifier.trim()}
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-50"
                    >
                      {addMemberBusy && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      <span>Add Member</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </AppLayout>
    </AuthGuard>
  );
}
