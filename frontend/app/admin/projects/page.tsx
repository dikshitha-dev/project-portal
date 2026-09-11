"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  LoadingSpinner,
  LoadingSkeleton,
  Input,
  Textarea,
  SearchInput,
} from "@/components";
import { Project, projectsAPI, User } from "@/lib/api";
import { authService } from "@/lib/services/auth";
import {
  Plus,
  Search,
  KeyRound,
  FolderPlus,
  FolderKanban,
  Users,
  Calendar,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";

function ProjectsDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    public_joining: false,
  });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    public_joining: false,
  });
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  const [inviteCode, setInviteCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Check URL query for join code (e.g. /admin/projects?join=ABCD1234)
  useEffect(() => {
    const code = searchParams.get("join");
    if (code) {
      setInviteCode(code.toUpperCase());
      setShowJoinModal(true);
    }
  }, [searchParams]);

  // Load user
  useEffect(() => {
    authService.getMe().then(({ user }) => {
      if (user) setCurrentUser(user);
    }).catch(() => {});
  }, []);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects by search query in real time
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.owner_name && p.owner_name.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  // Handle Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setCreateError("Project name is required.");
      return;
    }

    setCreateBusy(true);
    setCreateError("");
    try {
      const res = await projectsAPI.create({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        public_joining: createForm.public_joining,
      });
      setShowCreateModal(false);
      setCreateForm({ name: "", description: "", public_joining: false });
      // Add new project immediately to state
      setProjects((prev) => [res.data.project, ...prev]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create project.";
      setCreateError(msg);
    } finally {
      setCreateBusy(false);
    }
  };

  // Handle Edit Project
  const openEditModal = (project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(project);
    setEditForm({
      name: project.name,
      description: project.description || "",
      public_joining: project.public_joining,
    });
    setEditError("");
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editForm.name.trim()) {
      setEditError("Project name is required.");
      return;
    }

    setEditBusy(true);
    setEditError("");
    try {
      const res = await projectsAPI.update(editingProject.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        public_joining: editForm.public_joining,
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? res.data.project : p))
      );
      setEditingProject(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update project.";
      setEditError(msg);
    } finally {
      setEditBusy(false);
    }
  };

  // Handle Delete Project
  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this project? All associated weeks and data will be removed."
      )
    ) {
      return;
    }

    setDeletingId(projectId);
    try {
      await projectsAPI.delete(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to delete project.";
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Join Project via Code
  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setJoinBusy(true);
    setJoinMessage(null);
    try {
      const res = await projectsAPI.submitJoinRequest(inviteCode.trim().toUpperCase());
      setJoinMessage({
        type: "success",
        text:
          res.data.message ||
          "Join request submitted! Awaiting admin approval.",
      });
      setInviteCode("");
      fetchProjects();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid invite code or unable to submit join request.";
      setJoinMessage({
        type: "error",
        text: msg,
      });
    } finally {
      setJoinBusy(false);
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

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-primary-100/60">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <span className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-600 bg-clip-text text-transparent">
                  Projects
                </span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm font-medium">
                Projects you own or belong to
              </p>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Real-time Search */}
              <div className="min-w-[260px] flex-1 sm:flex-initial">
                <SearchInput
                  placeholder="Search by project name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery("")}
                />
              </div>

              {/* Join Project Button */}
              <button
                onClick={() => {
                  setShowJoinModal(true);
                  setJoinMessage(null);
                }}
                className="btn-secondary flex items-center gap-2 text-sm py-2 px-3.5 rounded-xl border border-primary-200 hover:border-primary-400 text-primary-700 bg-white/80 hover:bg-primary-50/50 shadow-sm transition-all"
              >
                <KeyRound size={16} className="text-primary-600" />
                <span>Join Project</span>
              </button>

              {/* + New Project Button */}
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setCreateError("");
                }}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4 rounded-xl shadow-glow hover:shadow-glow-lg transition-all"
              >
                <Plus size={18} />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="py-12">
              <LoadingSkeleton rows={4} />
            </div>
          ) : projects.length === 0 ? (
            /* Empty State: No projects exist yet */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-static text-center py-20 px-6 flex flex-col items-center justify-center max-w-lg mx-auto border-2 border-dashed border-primary-200/80 bg-white/60 backdrop-blur-sm rounded-3xl shadow-soft"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-100 to-indigo-50 border border-primary-200/60 flex items-center justify-center text-primary-600 shadow-inner mb-6">
                <FolderPlus size={38} className="text-primary-600 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No projects yet
              </h2>
              <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
                Create a project to start assigning tasks to your team.
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-6 py-3 rounded-xl shadow-glow text-sm font-semibold flex items-center gap-2"
              >
                <Plus size={18} />
                <span>Create your first project</span>
              </motion.button>
            </motion.div>
          ) : filteredProjects.length === 0 ? (
            /* Search yielded no matches */
            <div className="text-center py-16 bg-white/40 border border-gray-200/60 rounded-2xl p-8">
              <Search size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-700">
                No projects matching &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Try searching with a different term or clear search filter.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            /* Project Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, idx) => {
                const isOwner =
                  project.is_owner ||
                  project.owner_id === currentUser?.id ||
                  currentUser?.email === "admin@portal.com";

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onClick={() => router.push(`/admin/projects/${project.id}`)}
                    className="card group cursor-pointer relative flex flex-col justify-between border border-primary-100/70 hover:border-primary-300 bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Top Header: Badge & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {project.status || "Active"}
                        </span>

                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                          {project.public_joining ? (
                            <span
                              className="flex items-center gap-1 text-emerald-600 bg-emerald-50/70 px-2 py-0.5 rounded-md"
                              title="Public Joining Enabled"
                            >
                              <Globe size={12} />
                              <span>Public</span>
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-1 text-gray-500 bg-gray-100/70 px-2 py-0.5 rounded-md"
                              title="Private Project (Approval Required)"
                            >
                              <Lock size={12} />
                              <span>Private</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Project Name */}
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">
                        {project.name}
                      </h3>

                      {/* Short Description */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-5 leading-relaxed min-h-[2.5rem]">
                        {project.description || (
                          <span className="italic text-gray-400">
                            No description provided.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {/* Owner Name */}
                        <div
                          className="flex items-center gap-1.5 font-medium truncate max-w-[150px]"
                          title={project.owner_name || "Owner"}
                        >
                          <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[10px]">
                            {(project.owner_name || "A")[0].toUpperCase()}
                          </div>
                          <span className="truncate">
                            {project.owner_name || "Admin"}
                          </span>
                        </div>

                        {/* Total Members */}
                        <span className="flex items-center gap-1 font-medium bg-primary-50/60 text-primary-700 px-2 py-0.5 rounded-md">
                          <Users size={12} />
                          <span>
                            {project.members_count || 1}{" "}
                            {project.members_count === 1 ? "member" : "members"}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        {/* Created Date */}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          <span>{formatDate(project.created_at)}</span>
                        </span>

                        {/* Action buttons on card */}
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isOwner && (
                            <>
                              <button
                                onClick={(e) => openEditModal(project, e)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                title="Edit Project"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) =>
                                  handleDeleteProject(project.id, e)
                                }
                                disabled={deletingId === project.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                title="Delete Project"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() =>
                              router.push(`/admin/projects/${project.id}`)
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                          >
                            <span>Open</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal 1: + New Project Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-primary-100 overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 to-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                      <FolderPlus size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Create New Project
                      </h2>
                      <p className="text-xs text-gray-500">
                        Start a new project space for roadmap & task management
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateProject} className="p-6 space-y-5">
                  {createError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{createError}</span>
                    </div>
                  )}

                  {/* Project Name */}
                  <Input
                    label="Project Name"
                    required
                    placeholder="e.g. AI Mentorship Portal v2"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />

                  {/* Project Description */}
                  <Textarea
                    label="Project Description"
                    rows={3}
                    placeholder="Brief overview of the project objectives, scope, and deliverables..."
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />

                  {/* Owner (Auto-filled, Read-only) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Owner (Auto-filled)
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2 bg-gray-100/80 border border-gray-200 rounded-xl text-gray-600 text-xs">
                      <ShieldCheck size={16} className="text-primary-600" />
                      <span className="font-semibold text-gray-800">
                        {currentUser?.name || "Admin"}
                      </span>
                      <span className="text-gray-400">
                        ({currentUser?.email || "admin@portal.com"})
                      </span>
                    </div>
                  </div>

                  {/* Public Joining Toggle */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">
                        Public Joining
                      </span>
                      <span className="text-[11px] text-gray-500 block max-w-xs">
                        Allow users with invite code to request to join. (Private by default)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCreateForm((p) => ({
                          ...p,
                          public_joining: !p.public_joining,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        createForm.public_joining
                          ? "bg-primary-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          createForm.public_joining
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createBusy}
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-60"
                    >
                      {createBusy && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      <span>Create Project</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal 2: Join Project Modal */}
        <AnimatePresence>
          {showJoinModal && (
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
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Join Project with Code
                      </h2>
                      <p className="text-xs text-gray-500">
                        Enter the invite code shared by your project administrator. A valid code creates a join request for approval.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleJoinProject} className="p-6 space-y-4">
                  {joinMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                        joinMessage.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {joinMessage.type === "success" ? (
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className="leading-relaxed">{joinMessage.text}</span>
                    </div>
                  )}

                  <div>
                    <Input
                      label="Invite Code"
                      required
                      placeholder="e.g. 9F3B7C2A"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="font-mono uppercase tracking-widest text-center text-lg"
                      helperText="Entering an invite code sends a request to the project owner. Once accepted, the project will be visible in your dashboard."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(false)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={joinBusy || !inviteCode.trim()}
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-50"
                    >
                      {joinBusy && <Loader2 size={16} className="animate-spin" />}
                      <span>Send Join Request</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal 3: Edit Project Modal */}
        <AnimatePresence>
          {editingProject && (
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
                    onClick={() => setEditingProject(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleUpdateProject} className="p-6 space-y-5">
                  {editError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <Input
                    label="Project Name"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />

                  <Textarea
                    label="Project Description"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((p) => ({
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
                        Enable or disable invite codes for joining requests.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((p) => ({
                          ...p,
                          public_joining: !p.public_joining,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        editForm.public_joining
                          ? "bg-primary-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editForm.public_joining
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editBusy}
                      className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold shadow-glow flex items-center gap-2 disabled:opacity-60"
                    >
                      {editBusy && <Loader2 size={16} className="animate-spin" />}
                      <span>Save Changes</span>
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

export default function ProjectsDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050816] flex items-center justify-center text-white"><div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" /></div>}>
      <ProjectsDashboardContent />
    </Suspense>
  );
}
