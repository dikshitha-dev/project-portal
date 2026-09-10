"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AppLayout,
  GradeCard,
  AuthGuard,
  LoadingSkeleton,
} from "@/components";
import { gradesAPI, submissionsAPI, authAPI, reviewsAPI, projectsAPI } from "@/lib/api";
import {
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Award,
  BookOpen,
  FolderKanban,
  ChevronDown,
  Layers,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function GradesPage() {
  const [user, setUser] = useState(null);
  const [candidateGrades, setCandidateGrades] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rubric, setRubric] = useState({
    ui: 0, functionality: 0, github: 0, documentation: 0, innovation: 0, weekly_progress: 0,
  });
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const role = user?.role;

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        if (user.role === "candidate") {
          const res = await gradesAPI.getCandidateGrades(user.id);
          setCandidateGrades(res.data.grades);
        } else {
          const [gradesRes, subsRes, candsRes] = await Promise.all([
            gradesAPI.getAll(),
            submissionsAPI.getAll(),
            authAPI.getCandidates(),
          ]);
          setAllGrades(gradesRes.data.grades);
          setSubmissions(subsRes.data.submissions);
          setCandidates(candsRes.data.candidates);
        }
      } catch (err) {
        console.error("Failed to load grades:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSelectSubmission = (sub) => {
    setSelectedSubmission(sub);
    setMessage("");
    const existing = allGrades.find((g) => g.submission_id === sub.id);
    if (existing) {
      setRubric({
        ui: existing.ui, functionality: existing.functionality, github: existing.github,
        documentation: existing.documentation, innovation: existing.innovation, weekly_progress: existing.weekly_progress,
      });
      setPublished(existing.published);
    } else {
      setRubric({ ui: 0, functionality: 0, github: 0, documentation: 0, innovation: 0, weekly_progress: 0 });
      setPublished(false);
    }
  };

  const total = Object.values(rubric).reduce((sum, v) => sum + Number(v || 0), 0);
  const getGrade = (totalScore) => {
    if (totalScore >= 90) return "A+";
    if (totalScore >= 80) return "A";
    if (totalScore >= 70) return "B";
    if (totalScore >= 60) return "C";
    return "Needs Improvement";
  };

  const handleSave = async (publish = false) => {
    if (!selectedSubmission) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await gradesAPI.createOrUpdate({
        submission_id: selectedSubmission.id,
        ...rubric,
        published: published || publish,
      });
      setMessage(res.data.grade.grade === "A+" || res.data.grade.total >= 60 ? "Grade saved successfully!" : `Grade saved. Current: ${res.data.grade.grade}`);
      setRubric({
        ui: res.data.grade.ui, functionality: res.data.grade.functionality, github: res.data.grade.github,
        documentation: res.data.grade.documentation, innovation: res.data.grade.innovation, weekly_progress: res.data.grade.weekly_progress,
      });
      setPublished(res.data.grade.published);
      const gradesRes = await gradesAPI.getAll();
      setAllGrades(gradesRes.data.grades);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSubmission) return;
    await handleSave(true);
    try {
      const res = await gradesAPI.publish(selectedSubmission.id);
      setMessage(`Grade published: ${res.data.grade.grade} (${res.data.grade.total}/100)`);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to publish");
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <AppLayout>
          <LoadingSkeleton rows={4} />
        </AppLayout>
      </AuthGuard>
    );
  }

  if (role === "candidate") {
    return (
      <AuthGuard requiredRole="candidate">
        <AppLayout>
          <CandidateGradesView user={user} />
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black text-gray-900">Grade Management</h1>
            <p className="text-gray-500 mt-1">Grade candidate submissions using the rubric</p>
          </motion.div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-sm font-medium ${
                message.toLowerCase().includes("success") || message.includes("published") || message.includes("saved")
                  ? "bg-emerald-50/80 text-emerald-700 border border-emerald-200/60"
                  : "bg-red-50/80 text-red-600 border border-red-200/60"
              }`}
            >
              {message}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <div className="card-static">
                <h3 className="font-bold text-gray-900 mb-4">Select Submission</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {submissions.length === 0 && (
                    <p className="text-sm text-gray-400">No submissions to grade</p>
                  )}
                  {submissions.map((sub) => {
                    const hasGrade = allGrades.find((g) => g.submission_id === sub.id);
                    return (
                      <motion.button
                        key={sub.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectSubmission(sub)}
                        className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 ${
                          selectedSubmission?.id === sub.id
                            ? "bg-primary-50/80 border border-primary-200/60 shadow-glow"
                            : "bg-white/40 hover:bg-white/60 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{sub.user?.name}</p>
                            <p className="text-xs text-gray-500">{sub.week?.week_title}</p>
                          </div>
                          {hasGrade && <span className="badge-purple">{hasGrade.grade}</span>}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedSubmission ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-static"
                >
                  <h3 className="font-bold text-gray-900 mb-5">
                    Grading: {selectedSubmission.user?.name} — {selectedSubmission.week?.week_title}
                  </h3>

                  <div className="space-y-5">
                    <SliderRow label="UI / UX" max={20} value={rubric.ui} onChange={(v) => setRubric({ ...rubric, ui: v })} />
                    <SliderRow label="Functionality" max={25} value={rubric.functionality} onChange={(v) => setRubric({ ...rubric, functionality: v })} />
                    <SliderRow label="GitHub Quality" max={15} value={rubric.github} onChange={(v) => setRubric({ ...rubric, github: v })} />
                    <SliderRow label="Documentation" max={10} value={rubric.documentation} onChange={(v) => setRubric({ ...rubric, documentation: v })} />
                    <SliderRow label="Innovation" max={20} value={rubric.innovation} onChange={(v) => setRubric({ ...rubric, innovation: v })} />
                    <SliderRow label="Weekly Progress" max={10} value={rubric.weekly_progress} onChange={(v) => setRubric({ ...rubric, weekly_progress: v })} />
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100/80 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium">Total Score</p>
                        <p className="text-3xl font-black text-gray-900">{total}<span className="text-lg text-gray-400">/100</span></p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-medium">Grade</p>
                        <p className="text-2xl font-black gradient-text">{getGrade(total)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSave()} disabled={saving} className="btn-secondary disabled:opacity-50">
                        Save Draft
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePublish} disabled={saving} className="btn-primary disabled:opacity-50">
                        Publish Review
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="card-static text-center py-20 text-gray-400">
                  Select a submission to grade
                </div>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-static"
          >
            <h3 className="font-bold text-gray-900 mb-5">All Grades</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100/80 text-left text-gray-500">
                    <th className="pb-3 pr-4 font-semibold">Candidate</th>
                    <th className="pb-3 pr-4 font-semibold">Week</th>
                    <th className="pb-3 pr-4 font-semibold">Score</th>
                    <th className="pb-3 pr-4 font-semibold">Grade</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allGrades.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-400">No grades yet</td></tr>
                  )}
                  {allGrades.map((g) => (
                    <tr key={g.id} className="border-b border-gray-50/80 hover:bg-white/40 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-gray-900">{g.user?.name}</td>
                      <td className="py-3.5 pr-4 text-gray-600">{g.week?.week_title}</td>
                      <td className="py-3.5 pr-4 text-gray-900 font-bold">{g.total}</td>
                      <td className="py-3.5 pr-4"><span className="badge-purple">{g.grade}</span></td>
                      <td className="py-3.5">{g.published ? <span className="badge-green">Published</span> : <span className="badge-yellow">Draft</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function SliderRow({ label, max, value, onChange }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900">{value}/{max}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max={max}
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
          style={{ "--val": `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CandidateGradesView({ user }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProject, setLoadingProject] = useState(false);

  // 1. Fetch assigned projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await projectsAPI.getAll();
        const list = res.data.projects || [];
        setProjects(list);

        if (list.length > 0) {
          const savedId = typeof window !== "undefined" ? localStorage.getItem("activeProjectId") : null;
          const matched = list.find((p) => p.id === savedId) || list[0];
          setActiveProject(matched);
        }
      } catch (err) {
        console.error("Failed to fetch assigned projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // 2. Fetch project details, weeks, submissions, grades, and issues when activeProject changes
  useEffect(() => {
    if (!activeProject?.id || !user?.id) return;

    const loadProjectData = async () => {
      setLoadingProject(true);
      try {
        localStorage.setItem("activeProjectId", activeProject.id);

        const [weeksRes, subsRes, gradesRes, issuesRes] = await Promise.all([
          projectsAPI.getWeeks(activeProject.id),
          submissionsAPI.getByCandidate(user.id, activeProject.id),
          gradesAPI.getCandidateGrades(user.id, activeProject.id),
          reviewsAPI.getIssuesByCandidate(user.id),
        ]);

        const fetchedWeeks = (weeksRes.data.weeks || []).sort(
          (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
        const fetchedSubs = subsRes.data.submissions || [];
        const fetchedGrades = gradesRes.data.grades || [];
        const fetchedIssues = issuesRes.data.issues || [];

        setWeeks(fetchedWeeks);
        setSubmissions(fetchedSubs);
        setGrades(fetchedGrades);
        setIssues(fetchedIssues);

        // Auto-select week: default to latest evaluated week, or first submitted week, or first week
        if (fetchedGrades.length > 0) {
          const latestGradedSub = fetchedSubs.find((s) => s.id === fetchedGrades[0].submission_id);
          const targetWeekId = latestGradedSub?.week_id || fetchedGrades[0].week?.id || fetchedWeeks[0]?.id;
          setSelectedWeekId(targetWeekId);
        } else if (fetchedWeeks.length > 0) {
          setSelectedWeekId(fetchedWeeks[0].id);
        }
      } catch (err) {
        console.error("Failed to load project grades data:", err);
      } finally {
        setLoadingProject(false);
      }
    };

    loadProjectData();
  }, [activeProject?.id, user?.id]);

  // Project change handler
  const handleSelectProject = (projectId) => {
    const selected = projects.find((p) => p.id === projectId);
    if (selected) {
      setActiveProject(selected);
    }
  };

  // Current selected week and its evaluation
  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || weeks[0] || null;
  const currentSubmission = submissions.find((s) => s.week_id === (currentWeek?.id || selectedWeekId));
  const currentGrade = grades.find((g) => {
    if (currentSubmission && g.submission_id === currentSubmission.id) return true;
    if (g.week?.id === currentWeek?.id) return true;
    return false;
  }) || (grades.length > 0 ? grades[0] : null);

  // Overall calculations across evaluated submissions
  const hasEvaluatedGrades = grades.length > 0;
  const overallScoreNum = hasEvaluatedGrades
    ? Number((grades.reduce((sum, g) => sum + (g.total || 0), 0) / grades.length).toFixed(1))
    : null;
  const overallPercentage = overallScoreNum !== null ? Math.round(overallScoreNum) : null;

  const getLetterGrade = (score) => {
    if (score === null || score === undefined) return "—";
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "Needs Improvement";
  };

  const overallGradeLetter = currentGrade?.grade || getLetterGrade(overallScoreNum);
  const isApproved = currentGrade ? currentGrade.published : grades.some((g) => g.published);

  // Rubric Criteria definitions with max marks summing to 100
  const RUBRIC_CRITERIA = [
    { key: "ui", label: "UI / UX", max: 20, value: currentGrade?.ui ?? 0 },
    { key: "functionality", label: "Functionality", max: 25, value: currentGrade?.functionality ?? 0 },
    { key: "github", label: "GitHub Quality", max: 15, value: currentGrade?.github ?? 0 },
    { key: "documentation", label: "Documentation", max: 10, value: currentGrade?.documentation ?? 0 },
    { key: "innovation", label: "Innovation", max: 20, value: currentGrade?.innovation ?? 0 },
    { key: "weekly_progress", label: "Weekly Progress", max: 10, value: currentGrade?.weekly_progress ?? 0 },
  ];

  const currentTotalMarks = currentGrade ? currentGrade.total : 0;

  if (loading) {
    return (
      <div className="py-12 max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  // If candidate has no projects assigned yet (no invite modal on Grades page)
  if (projects.length === 0) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-gray-900">My Grades</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            View evaluations, rubric scores, and mentor feedback for your assigned project
          </p>
        </motion.div>

        <div className="card-static text-center py-20 px-6 max-w-md mx-auto border-2 border-dashed border-primary-200/70 rounded-2xl bg-white/70 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <Award size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            No evaluated projects yet
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Once your mentor adds you to a project and reviews your weekly submissions, your grades and rubric breakdown will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Project Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-primary-100/60">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-gray-900">My Grades</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Evaluation rubric, mentor feedback, and submission performance
          </p>
        </motion.div>

        {/* Project Selector / Indicator */}
        {projects.length > 1 ? (
          <div className="flex items-center gap-3 p-2.5 px-4 bg-white/90 backdrop-blur-md rounded-2xl border border-primary-200/80 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <FolderKanban size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 block">
                Selected Project
              </span>
              <div className="relative inline-block">
                <select
                  value={activeProject?.id || ""}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  className="text-sm font-bold text-gray-900 bg-transparent pr-7 focus:outline-none cursor-pointer appearance-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2.5 px-4 bg-white/90 backdrop-blur-md rounded-2xl border border-primary-100/80 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <FolderKanban size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 block">
                Assigned Project
              </span>
              <span className="text-sm font-bold text-gray-900">
                {activeProject?.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {loadingProject ? (
        <div className="py-12">
          <LoadingSkeleton rows={3} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: OVERALL GRADE CARD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-static bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white rounded-3xl p-7 md:p-9 shadow-glow relative overflow-hidden"
          >
            {/* Ambient background decoration */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Overall Score & Project Info */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-primary-100">
                  <Sparkles size={13} className="text-amber-300" />
                  <span>Overall Project Evaluation • {activeProject?.name}</span>
                </div>

                <div>
                  <p className="text-xs font-bold text-primary-200 uppercase tracking-wider">
                    Overall Score
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl md:text-6xl font-black tracking-tight text-white">
                      {overallScoreNum !== null ? overallScoreNum : "—"}
                    </span>
                    <span className="text-2xl font-bold text-primary-200">/ 100</span>
                  </div>
                </div>

                <p className="text-xs text-primary-100 max-w-md">
                  Calculated across {grades.length} evaluated submission{grades.length === 1 ? "" : "s"} for project <strong>{activeProject?.name}</strong>.
                </p>
              </div>

              {/* Right: Key Badges (Percentage, Letter Grade, Approval Status) */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[280px] md:min-w-[340px]">
                {/* Percentage */}
                <div className="text-center p-2 rounded-xl bg-white/10">
                  <span className="text-[10px] font-bold text-primary-200 uppercase tracking-wider block">
                    Percentage
                  </span>
                  <span className="text-2xl md:text-3xl font-black text-white mt-1 block">
                    {overallPercentage !== null ? `${overallPercentage}%` : "—"}
                  </span>
                </div>

                {/* Letter Grade */}
                <div className="text-center p-2 rounded-xl bg-white/10">
                  <span className="text-[10px] font-bold text-primary-200 uppercase tracking-wider block">
                    Letter Grade
                  </span>
                  <span className="text-2xl md:text-3xl font-black text-amber-300 mt-1 block">
                    {overallGradeLetter}
                  </span>
                </div>

                {/* Approval Status */}
                <div className="text-center p-2 rounded-xl bg-white/10 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-200 uppercase tracking-wider block">
                    Status
                  </span>
                  <div className="mt-1.5">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                        <CheckCircle2 size={12} />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECTION 2: RUBRIC BREAKDOWN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-static bg-white rounded-3xl border border-primary-100/90 p-7 md:p-8 shadow-sm space-y-6"
          >
            {/* Header with Total = 100 Marks banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                    <BarChart3 size={18} />
                  </div>
                  <h2 className="text-xl font-black text-gray-900">
                    Rubric Breakdown
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Evaluation for: <strong className="text-primary-700">{currentWeek?.week_title || "Current Milestone"}</strong>
                  {currentGrade ? ` (${currentGrade.published ? "Published" : "Draft Evaluation"})` : " (Awaiting Evaluation)"}
                </p>
              </div>

              {/* Total = 100 Marks Badge */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-primary-50 border border-primary-200/80 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 block">
                    Rubric Total
                  </span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="text-xl font-black text-gray-900">
                      {currentGrade ? currentTotalMarks : 0}
                    </span>
                    <span className="text-xs font-bold text-gray-400">/ 100 Marks</span>
                  </div>
                </div>

                <div className="hidden sm:block px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600">
                  Total = 100 Marks
                </div>
              </div>
            </div>

            {/* Rubric Criteria Grid / Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {RUBRIC_CRITERIA.map((criterion) => {
                const pct = Math.min(100, Math.round((criterion.value / criterion.max) * 100));
                return (
                  <div
                    key={criterion.key}
                    className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-primary-200 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {criterion.label}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                          Max {criterion.max}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">
                          {criterion.value}
                          <span className="text-xs font-normal text-gray-400">/{criterion.max}</span>
                        </span>
                        <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-gray-200/80 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Marks Banner */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 border-t border-gray-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles size={14} className="text-primary-500" />
                <span>Standardized Rubric: UI/UX (20) + Functionality (25) + GitHub (15) + Docs (10) + Innovation (20) + Progress (10) = <strong>100 Marks</strong></span>
              </span>
              <span className="font-bold text-primary-700">
                Current Milestone: {currentGrade ? `${currentTotalMarks}/100` : "Not evaluated yet"}
              </span>
            </div>
          </motion.div>

          {/* SECTION 3: MENTOR FEEDBACK */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-static bg-white rounded-3xl border border-primary-100/90 p-7 md:p-8 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Mentor Feedback
                </h3>
                <p className="text-xs text-gray-500">
                  Mentor remarks, corrections, and evaluation notes for this submission
                </p>
              </div>
            </div>

            {/* Mentor Comments / Issue Cards */}
            {issues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm space-y-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-gray-900">
                        {issue.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          issue.priority === "High"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : issue.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}
                      >
                        {issue.priority} Priority
                      </span>
                    </div>

                    {issue.description && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {issue.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                      <span>Status: <strong className="text-gray-700 font-semibold">{issue.status}</strong></span>
                      {issue.mark_deduction ? (
                        <span className="text-red-500 font-bold">-{issue.mark_deduction} pts deduction</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">No deduction</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-primary-50/60 border border-primary-100/70 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 size={24} className="text-primary-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900">
                    Mentor Remarks: {isApproved ? "Milestone Approved" : "Evaluation in Progress"}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {isApproved
                      ? "Great job! Your submission has met the criteria with clean execution. Continue maintaining this standard for upcoming deliverables."
                      : "Your submission has been received by your mentor and is queued for rubric evaluation. Written comments and scores will appear here once published."}
                  </p>
                </div>
              </div>
            )}

            {/* Candidate Submission Reflection Context (if any) */}
            {currentSubmission?.reflection && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/60 space-y-1 text-xs">
                <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Your Submitted Reflection
                </span>
                <p className="text-gray-600 italic leading-relaxed">
                  &ldquo;{currentSubmission.reflection}&rdquo;
                </p>
              </div>
            )}
          </motion.div>

          {/* SECTION 4: WEEK-WISE PERFORMANCE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-static bg-white rounded-3xl border border-primary-100/90 p-7 md:p-8 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Submissions Performance
                </h3>
                <p className="text-xs text-gray-500">
                  Select any submission below to inspect its individual score and rubric breakdown
                </p>
              </div>
              <span className="text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100">
                {submissions.length} Submission{submissions.length === 1 ? "" : "s"}
              </span>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No submissions evaluated for this project yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeks.map((week, idx) => {
                  const sub = submissions.find((s) => s.week_id === week.id);
                  const grade = grades.find((g) => g.submission_id === sub?.id || g.week?.id === week.id);
                  const isSelected = week.id === (currentWeek?.id || selectedWeekId);

                  let statusBadge = null;
                  if (grade?.published) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        Approved
                      </span>
                    );
                  } else if (sub) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={11} className="text-amber-600" />
                        Pending Review
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-200">
                        Not Submitted
                      </span>
                    );
                  }

                  return (
                    <motion.button
                      key={week.id}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedWeekId(week.id)}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 relative ${
                        isSelected
                          ? "bg-primary-50/50 border-primary-500 shadow-glow"
                          : "bg-white hover:bg-gray-50 border-gray-200/80 shadow-sm"
                      }`}
                    >
                      {/* Active indicator dot */}
                      {isSelected && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                      )}

                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 block">
                            Milestone {idx + 1}
                          </span>
                          <h4 className="font-bold text-gray-900 text-sm line-clamp-1">
                            {week.week_title}
                          </h4>
                        </div>
                        {grade ? (
                          <span className="badge-purple font-black text-xs">
                            {grade.grade}
                          </span>
                        ) : null}
                      </div>

                      {/* Score display */}
                      <div className="flex items-baseline justify-between pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 block">
                            Score
                          </span>
                          <span className="text-lg font-black text-gray-900">
                            {grade ? `${grade.total}/100` : "—"}
                          </span>
                        </div>
                        <div>{statusBadge}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

