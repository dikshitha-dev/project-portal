"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  ProgressChart,
  LoadingSkeleton,
  Input,
} from "@/components";
import {
  gradesAPI,
  reviewsAPI,
  submissionsAPI,
  projectsAPI,
} from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import {
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Star,
  Github,
  ExternalLink,
  TrendingUp,
  FolderKanban,
  Clock,
  KeyRound,
  CheckCircle2,
  X,
  Loader2,
  ChevronRight,
  Lock,
  Globe,
} from "lucide-react";

function CandidateDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [discoverProjects, setDiscoverProjects] = useState([]);
  const [activeProjectTab, setActiveProjectTab] = useState("my"); // "my" or "discover"
  const [joiningPublicId, setJoiningPublicId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [grades, setGrades] = useState([]);
  const [issues, setIssues] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Join Project Modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMsg, setJoinMsg] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    const activeUser = getStoredUser();
    if (activeUser) {
      setUser(activeUser);
    }
    if (!activeUser || !activeUser.id) {
      setLoading(false);
      return;
    }

    try {
      const [projectsRes, discoverRes, gradesRes, issuesRes, subsRes, statsRes] =
        await Promise.all([
          projectsAPI.getAll().catch(() => ({ data: { projects: [] } })),
          projectsAPI.getDiscover().catch(() => ({ data: { projects: [] } })),
          gradesAPI.getCandidateGrades(activeUser.id).catch(() => ({ data: { grades: [] } })),
          reviewsAPI.getIssuesByCandidate(activeUser.id).catch(() => ({ data: { issues: [] } })),
          submissionsAPI.getByCandidate(activeUser.id).catch(() => ({ data: { submissions: [] } })),
          gradesAPI.getCandidateStats(activeUser.id).catch(() => ({ data: {} })),
        ]);

      setProjects(projectsRes.data.projects || []);
      setDiscoverProjects(discoverRes.data.projects || []);
      setGrades(gradesRes.data.grades || []);
      setIssues(issuesRes.data.issues || []);
      setSubmissions(subsRes.data.submissions || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("join");
      if (code) {
        setInviteCode(code.toUpperCase());
        setShowJoinModal(true);
      }
    }
  }, [fetchDashboardData]);

  const handleJoinProject = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoinBusy(true);
    setJoinMsg(null);
    try {
      const res = await projectsAPI.submitJoinRequest(
        inviteCode.trim().toUpperCase()
      );
      setJoinMsg({
        type: "success",
        text:
          res.data.message ||
          "Join request submitted! Awaiting admin approval.",
      });
      setInviteCode("");
      await fetchDashboardData();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        "Invalid invite code or unable to submit join request.";
      setJoinMsg({ type: "error", text: msg });
    } finally {
      setJoinBusy(false);
    }
  };

  const handleJoinPublic = async (projId) => {
    setJoiningPublicId(projId);
    try {
      await projectsAPI.joinPublic(projId);
      await fetchDashboardData();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to join project.";
      alert(msg);
    } finally {
      setJoiningPublicId(null);
    }
  };

  const handleCancelRequest = async (projId) => {
    if (!confirm("Are you sure you want to withdraw this join request?")) return;
    setCancellingId(projId);
    try {
      await projectsAPI.cancelJoinRequest(projId);
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to cancel join request:", err);
    } finally {
      setCancellingId(null);
    }
  };

  const pendingIssues = issues.filter((i) => i.status === "To Do").length;
  const resolvedIssues = issues.filter((i) => i.status === "Fixed").length;
  const currentWeekGrade = grades[grades.length - 1]?.grade || "—";
  const latestSubmission = submissions[0];

  const chartData = grades
    .slice()
    .sort((a, b) => (a.week?.week_title > b.week?.week_title ? 1 : -1))
    .map((g) => ({ week: g.week?.week_title, total: g.total }));

  if (loading) {
    return (
      <AppLayout>
        <LoadingSkeleton rows={4} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Welcome back, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Track your assigned projects, deliverables, and mentor feedback
            </p>
          </div>

          <button
            onClick={() => {
              setShowJoinModal(true);
              setJoinMsg(null);
            }}
            className="btn-secondary self-start sm:self-auto flex items-center gap-2 text-xs py-2 px-3.5 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 transition-colors shadow-sm"
          >
            <KeyRound size={15} className="text-primary-600" />
            <span>Join Project with Code</span>
          </button>
        </div>

        {/* PROJECTS & DISCOVERY SECTION */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveProjectTab("my")}
                  className={`text-lg sm:text-xl font-bold flex items-center gap-2 pb-1 border-b-2 transition-all ${
                    activeProjectTab === "my"
                      ? "border-primary-600 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <FolderKanban size={20} className={activeProjectTab === "my" ? "text-primary-600" : ""} />
                  <span>My Projects</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    activeProjectTab === "my" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {projects.filter(p => !p.membership_status || p.membership_status === "approved").length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveProjectTab("discover")}
                  className={`text-lg sm:text-xl font-bold flex items-center gap-2 pb-1 border-b-2 transition-all ml-4 ${
                    activeProjectTab === "discover"
                      ? "border-primary-600 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Globe size={20} className={activeProjectTab === "discover" ? "text-primary-600" : ""} />
                  <span>Discover Projects</span>
                  {discoverProjects.filter(p => p.membership_status !== "approved").length > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activeProjectTab === "discover" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {discoverProjects.filter(p => p.membership_status !== "approved").length}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {activeProjectTab === "my"
                  ? "Projects you are an approved member of or have requested access to"
                  : "Public projects open for candidates to explore and join"}
              </p>
            </div>
          </div>

          {/* TAB 1: MY PROJECTS & REQUESTS */}
          {activeProjectTab === "my" && (
            <div className="space-y-6">
              {/* 1. Pending Join Requests */}
              {projects.filter((p) => p.membership_status === "pending").length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={16} className="text-amber-500" />
                    <span>Pending Join Requests</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects
                      .filter((p) => p.membership_status === "pending")
                      .map((proj) => (
                        <div
                          key={proj.id}
                          className="card flex flex-col justify-between p-5 bg-gradient-to-br from-amber-50/50 to-white border border-amber-200/80 rounded-2xl shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                                <Clock size={12} className="text-amber-600" />
                                <span>Waiting for admin approval</span>
                              </span>
                              {proj.user_join_request?.created_at && (
                                <span className="text-[11px] text-gray-400">
                                  Requested {new Date(proj.user_join_request.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-gray-900 mb-1">
                              {proj.name}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {proj.description || "No description provided."}
                            </p>
                          </div>
                          <div className="pt-4 mt-3 border-t border-amber-100/80 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">
                              Mentor: {proj.owner_name || "Admin"}
                            </span>
                            <button
                              onClick={() => handleCancelRequest(proj.id)}
                              disabled={cancellingId === proj.id}
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {cancellingId === proj.id && <Loader2 size={12} className="animate-spin" />}
                              <span>Withdraw Request</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 2. Rejected Requests */}
              {projects.filter((p) => p.membership_status === "rejected").length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span>Rejected Requests</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects
                      .filter((p) => p.membership_status === "rejected")
                      .map((proj) => (
                        <div
                          key={proj.id}
                          className="card flex flex-col justify-between p-5 bg-red-50/40 border border-red-200/80 rounded-2xl shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                <AlertCircle size={12} className="text-red-600" />
                                <span>Request Rejected</span>
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-gray-900 mb-1">
                              {proj.name}
                            </h4>
                            {proj.user_join_request?.feedback && (
                              <p className="text-xs text-red-700 bg-red-100/60 p-2 rounded-xl mt-2">
                                <strong>Reason:</strong> {proj.user_join_request.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 3. Approved Active Projects Grid */}
              {projects.filter((p) => !p.membership_status || p.membership_status === "approved").length === 0 ? (
                /* STATIC Empty State: No active approved projects yet */
                <div className="card-static text-center py-16 px-6 max-w-md mx-auto border-2 border-dashed border-primary-200/80 rounded-3xl bg-white/70 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                    <Lock size={30} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                    No active projects yet
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
                    Enter an invite code to join a project or browse Discover Projects to join open public projects.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="btn-primary py-2.5 px-5 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <KeyRound size={15} />
                      <span>Join with Invite Code</span>
                    </button>
                    <button
                      onClick={() => setActiveProjectTab("discover")}
                      className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <Globe size={15} />
                      <span>Browse Public Projects</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Project Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects
                    .filter((p) => !p.membership_status || p.membership_status === "approved")
                    .map((project) => {
                      const progress = project.progress_percent || 0;
                      const isCompleted = progress === 100;

                      return (
                        <div
                          key={project.id}
                          onClick={() => router.push(`/projects/${project.id}`)}
                          className="card cursor-pointer group bg-white/95 rounded-2xl border border-primary-100/80 hover:border-primary-300 hover:-translate-y-1 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
                        >
                          <div>
                            {/* Top Badge: Status */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isCompleted
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isCompleted ? "bg-purple-500" : "bg-emerald-500"
                                  }`}
                                />
                                {isCompleted ? "Completed" : project.status || "Active"}
                              </span>
                            </div>

                            {/* Project Name */}
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1.5">
                              {project.name}
                            </h3>

                            {/* Description */}
                            <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed min-h-[2rem]">
                              {project.description || (
                                <span className="text-gray-400 italic">
                                  No description provided.
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Footer: Mentor & Workspace */}
                          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-gray-400">
                              Mentor: {project.owner_name || "Admin"}
                            </span>
                            <span className="inline-flex items-center gap-1 font-bold text-primary-600 group-hover:translate-x-0.5 transition-transform">
                              <span>Workspace</span>
                              <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISCOVER PROJECTS */}
          {activeProjectTab === "discover" && (
            <div className="space-y-6">
              {discoverProjects.length === 0 ? (
                <div className="card-static text-center py-16 px-6 max-w-md mx-auto border-2 border-dashed border-primary-200/80 rounded-3xl bg-white/70">
                  <Globe size={32} className="mx-auto text-primary-400 mb-3" />
                  <h3 className="text-base font-bold text-gray-900 mb-1">No public projects available</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    All currently active projects are private and require an invite code.
                  </p>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="btn-primary text-xs py-2 px-4 rounded-xl inline-flex items-center gap-2"
                  >
                    <KeyRound size={14} />
                    <span>Join with Code</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {discoverProjects.map((project) => {
                    const isMember = project.membership_status === "approved";
                    const isPending = project.membership_status === "pending";

                    return (
                      <div
                        key={project.id}
                        className="card flex flex-col justify-between p-6 bg-white/95 rounded-2xl border border-primary-100/80 shadow-sm hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Globe size={11} className="text-emerald-600" />
                              <span>Public Project</span>
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                            {project.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                            {project.description || "No description provided."}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] text-gray-400">
                            Mentor: {project.owner_name || "Admin"}
                          </span>

                          {isMember ? (
                            <button
                              onClick={() => router.push(`/projects/${project.id}`)}
                              className="btn-secondary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 font-semibold"
                            >
                              <span>Go to Workspace</span>
                              <ChevronRight size={13} />
                            </button>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={12} className="text-amber-600" />
                              <span>Pending Approval</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJoinPublic(project.id)}
                              disabled={joiningPublicId === project.id}
                              className="btn-primary text-xs py-1.5 px-4 rounded-xl shadow-sm flex items-center gap-1 font-semibold"
                            >
                              {joiningPublicId === project.id && (
                                <Loader2 size={12} className="animate-spin" />
                              )}
                              <span>Join Project</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Star className="text-primary-600" />}
            label="Overall Grade"
            value={stats?.average_score ? `${stats.average_score}/100` : "—"}
            sub={currentWeekGrade}
          />
          <StatCard
            icon={<AlertCircle className="text-amber-500" />}
            label="Pending Issues"
            value={pendingIssues}
            sub="To Do"
          />
          <StatCard
            icon={<CheckCircle className="text-emerald-500" />}
            label="Resolved Issues"
            value={resolvedIssues}
            sub="Fixed"
          />
          <StatCard
            icon={<TrendingUp className="text-blue-500" />}
            label="Avg Score"
            value={stats?.average_score || "—"}
            sub="All Submissions"
          />
        </div>

        {/* Performance Chart & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProgressChart data={chartData} title="Weekly Performance" />
          </div>

          <div className="space-y-5">
            <div className="card-static">
              <h3 className="font-bold text-gray-900 mb-4">Latest Evaluation</h3>
              {grades[grades.length - 1] ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {grades[grades.length - 1]?.week?.week_title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Score: {grades[grades.length - 1]?.total}/100
                    </p>
                  </div>
                  <div className="text-3xl font-black gradient-text">
                    {grades[grades.length - 1]?.grade}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No grades yet</p>
              )}
            </div>

            {latestSubmission && (
              <div className="card-static">
                <h3 className="font-bold text-gray-900 mb-4">Latest Links</h3>
                <div className="space-y-3">
                  {latestSubmission.github_url && (
                    <LinkRow
                      icon={<Github size={16} />}
                      label="GitHub"
                      url={latestSubmission.github_url}
                    />
                  )}
                  {latestSubmission.deployed_url && (
                    <LinkRow
                      icon={<ExternalLink size={16} />}
                      label="Deployed"
                      url={latestSubmission.deployed_url}
                    />
                  )}
                  {latestSubmission.linkedin_url && (
                    <LinkRow
                      icon={<ExternalLink size={16} />}
                      label="LinkedIn"
                      url={latestSubmission.linkedin_url}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mentor Feedback & Latest Reflection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {latestSubmission?.reflection && (
            <div className="card-static">
              <h3 className="font-bold text-gray-900 mb-4">Latest Reflection</h3>
              <p className="text-gray-600 leading-relaxed italic">
                &ldquo;{latestSubmission.reflection}&rdquo;
              </p>
            </div>
          )}

          <div className="card-static">
            <h3 className="font-bold text-gray-900 mb-4">Mentor Feedback</h3>
            {issues.length > 0 ? (
              <div className="space-y-3">
                {issues.slice(0, 5).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 bg-white/50 rounded-xl border border-gray-100/80"
                  >
                    {issue.status === "Fixed" ? (
                      <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {issue.title}
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <span
                          className={`badge ${
                            issue.priority === "High"
                              ? "badge-red"
                              : issue.priority === "Medium"
                              ? "badge-yellow"
                              : "badge-green"
                          }`}
                        >
                          {issue.priority}
                        </span>
                        <span
                          className={`badge ${
                            issue.status === "Fixed"
                              ? "badge-green"
                              : "badge-purple"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No feedback yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Join Project Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-primary-100 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound size={18} className="text-primary-600" />
                  <h4 className="font-bold text-gray-900 text-base">
                    Join Project with Code
                  </h4>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              {joinMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    joinMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {joinMsg.type === "success" ? (
                    <CheckCircle2
                      size={15}
                      className="text-emerald-600 flex-shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={15}
                      className="text-red-600 flex-shrink-0"
                    />
                  )}
                  <span>{joinMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleJoinProject} className="space-y-4">
                <div>
                  <Input
                    label="Invite Code"
                    type="text"
                    required
                    placeholder="e.g. 9F3B7C2A"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase())
                    }
                    className="font-mono uppercase tracking-widest text-center text-lg"
                  />
                  <p className="text-[11px] text-gray-500 mt-2 text-center">
                    Enter the invite code shared by your project administrator. A valid code creates a join request for approval.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-3.5 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={joinBusy || !inviteCode.trim()}
                    className="btn-primary text-xs py-2 px-4 rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    {joinBusy && <Loader2 size={13} className="animate-spin" />}
                    <span>Send Join Request</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="card-static group bg-white/90 rounded-2xl border border-primary-100/80 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {sub}
        </span>
      </div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
    </div>
  );
}

function LinkRow({ icon, label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-primary-50/60 border border-gray-100 hover:border-primary-200 text-xs text-gray-700 hover:text-primary-700 transition-all font-semibold group"
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-400 group-hover:text-primary-600 transition-colors">
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <ArrowUpRight
        size={14}
        className="text-gray-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
      />
    </a>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="candidate">
      <CandidateDashboardContent />
    </AuthGuard>
  );
}
