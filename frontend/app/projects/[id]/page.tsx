"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  LoadingSkeleton,
  SubmissionForm,
  SubmissionDetailView,
  WeekCard,
} from "@/components";
import {
  Project,
  Week,
  Grade,
  Submission,
  projectsAPI,
  weeksAPI,
  submissionsAPI,
  gradesAPI,
  reviewsAPI,
  User,
  Issue,
} from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Kanban,
  Upload,
  Star,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Award,
  BookOpen,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function CandidateProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.id as string) || "";

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const initialTab = (searchParams.get("tab") as "submit" | "grades") || "submit";
  const [activeTab, setActiveTab] = useState<"submit" | "grades">(initialTab);
  const [preselectedWeekId, setPreselectedWeekId] = useState<string | undefined>(
    searchParams.get("week") || undefined
  );

  // Access error states
  const [accessDenied, setAccessDenied] = useState<{
    status: string;
    message: string;
  } | null>(null);

  // Submitting form state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isEditingSubmit, setIsEditingSubmit] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Set active project in localStorage
  useEffect(() => {
    if (projectId) {
      localStorage.setItem("activeProjectId", projectId);
    }
  }, [projectId]);

  // Load project workspace data
  const loadWorkspace = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, weeksRes] = await Promise.all([
        projectsAPI.getOne(projectId),
        projectsAPI.getWeeks(projectId),
      ]);
      setProject(projRes.data.project);

      const sortedWeeks = (weeksRes.data.weeks || []).sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
      const finalWeeks = sortedWeeks.length > 0 ? sortedWeeks : [
        {
          id: "default",
          week_title: "Project Submission",
          objective: "Submit your GitHub repository, deployed website, project objectives, and screenshots for mentor review.",
          resources: "",
          deadline: new Date().toISOString().split("T")[0],
          project_id: projectId,
        }
      ];
      setWeeks(finalWeeks);

      // Fetch candidate submissions and grades for this project
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : null;
      if (u?.id) {
        const [subsRes, gradesRes, issuesRes] = await Promise.all([
          submissionsAPI.getByCandidate(u.id, projectId),
          gradesAPI.getCandidateGrades(u.id, projectId),
          reviewsAPI.getIssuesByCandidate(u.id),
        ]);
        setSubmissions(subsRes.data.submissions || []);
        setGrades(gradesRes.data.grades || []);
        setIssues(issuesRes.data.issues || []);
      }
      setAccessDenied(null);
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { error?: string; status?: string } } })?.response;
      if (resp?.status === 403) {
        setAccessDenied({
          status: resp.data?.status || "denied",
          message: resp.data?.error || "Access Denied. You are not an approved member of this project.",
        });
      } else {
        console.error("Failed to load project workspace:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadWorkspace();
  }, [projectId, loadWorkspace]);

  // Handle Submission inside this project
  const handleSubmitProject = async (formData: FormData) => {
    setSubmitting(true);
    try {
      formData.append("project_id", projectId);
      const targetWId = formData.get("week_id") as string;
      const existing = submissions.find((s) => s.week_id === targetWId);
      if (existing && isEditingSubmit) {
        await submissionsAPI.update(existing.id, formData);
      } else {
        await submissionsAPI.create(formData);
      }
      setSubmitSuccess(true);
      setIsEditingSubmit(false);
      await loadWorkspace();
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Submission failed:", err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Switch to submit with target week
  const handleStartSubmission = (weekId: string) => {
    setPreselectedWeekId(weekId);
    setIsEditingSubmit(false);
    setActiveTab("submit");
  };

  const submittedWeekIds = useMemo(
    () => new Set(submissions.map((s) => s.week_id)),
    [submissions]
  );

  // Project Progress stats
  const progressPercent = project?.progress_percent ?? (
    weeks.length > 0 ? Math.round((submittedWeekIds.size / weeks.length) * 100) : 0
  );

  const averageScore = useMemo(() => {
    if (grades.length === 0) return null;
    const total = grades.reduce((acc, g) => acc + (g.total || 0), 0);
    return Math.round(total / grades.length);
  }, [grades]);

  if (accessDenied) {
    return (
      <AuthGuard requiredRole="candidate">
        <AppLayout>
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-static max-w-md w-full text-center p-8 border border-red-200/70 bg-white/95 shadow-xl rounded-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5">
                <Lock size={30} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {accessDenied.status === "pending"
                  ? "Membership Pending Approval"
                  : "Private Project Access Denied"}
              </h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {accessDenied.message}
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-primary w-full py-2.5 rounded-xl text-sm font-semibold shadow-glow flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
              </button>
            </motion.div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (loading || !project) {
    return (
      <AuthGuard requiredRole="candidate">
        <AppLayout>
          <div className="py-12 max-w-7xl mx-auto space-y-6">
            <LoadingSkeleton rows={4} />
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="candidate">
      <AppLayout>
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
          {/* Top Header & Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-primary-100/60">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-primary-600 hover:border-primary-300 shadow-sm transition-all"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 uppercase tracking-wider">
                  <span>My Projects</span>
                  <span>/</span>
                  <span className="text-gray-500 font-normal">Workspace</span>
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

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-gray-100/80 rounded-xl border border-gray-200/80 shadow-inner">

              <button
                onClick={() => setActiveTab("submit")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "submit"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Upload size={15} />
                <span>Submit Project</span>
              </button>

              <button
                onClick={() => setActiveTab("grades")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "grades"
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Star size={15} />
                <span>My Grades ({grades.length})</span>
              </button>
            </div>
          </div>

          {/* Project Header Banner */}
          <div className="card-static bg-white/90 backdrop-blur-md rounded-2xl border border-primary-100/80 p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                Project Workspace
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                {project.name}
              </h2>
              <p className="text-sm text-gray-600 max-w-2xl line-clamp-2">
                {project.description || "No project description provided."}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                <span>Mentor: <strong className="text-gray-700 font-semibold">{project.owner_name || "Admin"}</strong></span>
                <span>•</span>
                <span>{submissions.length > 0 ? "Work Submitted" : "Pending Submission"}</span>
              </div>
            </div>
          </div>

          {/* TAB 1: SUBMIT PROJECT */}
          {activeTab === "submit" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Upload size={22} className="text-primary-600" />
                  <span>Submit Project</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Add your GitHub repository, deployed website, objectives, and screenshots
                </p>
              </div>

              {submitSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Project submitted successfully!</span>
                </div>
              )}

              {(() => {
                const targetWeekId = preselectedWeekId || weeks[0]?.id || "default";
                const existingSub = submissions.find((s) => s.week_id === targetWeekId);
                const targetWeek = weeks.find((w) => w.id === targetWeekId);

                return (
                  <div className="space-y-6">
                    {existingSub && !isEditingSubmit ? (
                      <SubmissionDetailView
                        submission={existingSub}
                        week={targetWeek}
                        projectName={project.name}
                        onEdit={() => setIsEditingSubmit(true)}
                        isAdmin={false}
                      />
                    ) : (
                      <div className="card-static bg-white/95 rounded-2xl border border-primary-100 p-8 shadow-sm">
                        {isEditingSubmit && (
                          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              Editing Submission
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsEditingSubmit(false)}
                              className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
                            >
                              Cancel Edit
                            </button>
                          </div>
                        )}
                        <SubmissionForm
                          weeks={weeks.length > 0 ? weeks : []}
                          projectId={projectId}
                          projectName={project.name}
                          initialWeekId={targetWeekId}
                          initialSubmission={isEditingSubmit ? existingSub : null}
                          isEdit={isEditingSubmit}
                          onSubmit={handleSubmitProject}
                          onCancel={isEditingSubmit ? () => setIsEditingSubmit(false) : undefined}
                          submitting={submitting}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* TAB 3: MY GRADES */}
          {activeTab === "grades" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Star size={22} className="text-amber-500" />
                  <span>Grades & Feedback for {project.name}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Track mentor evaluations, rubric scores, and review status for this project only
                </p>
              </div>

              {/* Overall Project Grade Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="card-static bg-gradient-to-br from-primary-600 to-indigo-700 text-white rounded-2xl p-6 shadow-glow">
                  <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider">
                    Average Score
                  </p>
                  <h4 className="text-4xl font-black mt-2">
                    {averageScore !== null ? `${averageScore}/100` : "—"}
                  </h4>
                  <p className="text-xs text-primary-200 mt-2">
                    Across {grades.length} evaluated submissions
                  </p>
                </div>

                <div className="card-static bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Project Submissions
                  </p>
                  <h4 className="text-3xl font-black text-gray-900 mt-2">
                    {submissions.length}
                  </h4>
                  <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>{submissions.length > 0 ? "Submitted" : "Pending"}</span>
                  </p>
                </div>

                <div className="card-static bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Feedback Items
                  </p>
                  <h4 className="text-3xl font-black text-gray-900 mt-2">
                    {issues.length}
                  </h4>
                  <p className="text-xs text-gray-500 mt-2">
                    Mentor annotations & issue cards
                  </p>
                </div>
              </div>

              {/* Project Evaluation */}
              {grades.length === 0 ? (
                <div className="card-static text-center py-20 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white/60">
                  <Award size={36} className="text-gray-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-gray-800">
                    No grades published yet for this project
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Once your mentor reviews your submitted project deliverables, your rubric scores and grade will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Project Evaluation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {grades.map((grade) => {
                      const sub = submissions.find((s) => s.id === grade.submission_id);
                      const week = weeks.find((w) => w.id === sub?.week_id) || sub?.week;

                      return (
                        <div
                          key={grade.id}
                          className="card bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                            <div>
                              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider block">
                                Evaluated Submission
                              </span>
                              <h5 className="font-bold text-gray-900 text-base">
                                {week?.week_title || "Project Deliverables"}
                              </h5>
                            </div>

                            <div className="text-right">
                              <span className="text-2xl font-black text-primary-700 block">
                                {grade.grade}
                              </span>
                              <span className="text-xs font-semibold text-gray-500">
                                {grade.total}/100 pts
                              </span>
                            </div>
                          </div>

                          {/* Rubric Breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                            <div className="p-2.5 bg-gray-50 rounded-xl">
                              <span className="text-gray-400 block text-[10px]">UI Design</span>
                              <strong className="text-gray-800">{grade.ui}/20</strong>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl">
                              <span className="text-gray-400 block text-[10px]">Functionality</span>
                              <strong className="text-gray-800">{grade.functionality}/20</strong>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl">
                              <span className="text-gray-400 block text-[10px]">GitHub Quality</span>
                              <strong className="text-gray-800">{grade.github}/20</strong>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl">
                              <span className="text-gray-400 block text-[10px]">Documentation</span>
                              <strong className="text-gray-800">{grade.documentation}/15</strong>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl">
                              <span className="text-gray-400 block text-[10px]">Innovation</span>
                              <strong className="text-gray-800">{grade.innovation}/15</strong>
                            </div>
                            <div className="p-2.5 bg-gray-50 rounded-xl">
                              <span className="text-gray-400 block text-[10px]">Progress</span>
                              <strong className="text-gray-800">{grade.weekly_progress}/10</strong>
                            </div>
                          </div>

                          {/* Approval status */}
                          <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 size={12} />
                              Published by Mentor
                            </span>
                            <span>{new Date(grade.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
