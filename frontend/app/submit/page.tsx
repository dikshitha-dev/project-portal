"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AuthGuard,
  SubmissionForm,
  SubmissionDetailView,
  LoadingSkeleton,
  ProjectSelector,
} from "@/components";
import {
  submissionsAPI,
  weeksAPI,
  Week,
  Project,
  Submission,
} from "@/lib/api";
import {
  CheckCircle2,
  Calendar,
  Layers,
  Upload,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";

function SubmitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProjectId = searchParams.get("project_id");
  const queryWeekId = searchParams.get("week_id");

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadDataForProject = async (projId: string, preferredWeekId?: string) => {
    setLoading(true);
    try {
      const [weeksRes, subsRes] = await Promise.all([
        weeksAPI.getAll(projId),
        submissionsAPI.getAll(projId),
      ]);

      const sortedWeeks = (weeksRes.data.weeks || []).sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
      const userSubs = subsRes.data.submissions || [];

      const finalWeeks = sortedWeeks.length > 0 ? sortedWeeks : [
        {
          id: "default",
          week_title: "Project Submission",
          objective: "Submit your GitHub repository, deployed website, project objectives, and screenshots for mentor review.",
          resources: "",
          deadline: new Date().toISOString().split("T")[0],
          project_id: projId,
        }
      ];

      setWeeks(finalWeeks);
      setSubmissions(userSubs);

      // Select week: preferred week or queryWeekId or first unsubmitted week or first week
      const targetWeekId =
        preferredWeekId ||
        queryWeekId ||
        finalWeeks.find((w) => !userSubs.some((s) => s.week_id === w.id))?.id ||
        finalWeeks[0]?.id ||
        "default";

      setSelectedWeekId(targetWeekId);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to load project submission data:", err);
      const fallbackWeeks: Week[] = [
        {
          id: "default",
          week_title: "Project Submission",
          objective: "Submit your GitHub repository, deployed website, project objectives, and screenshots for mentor review.",
          resources: "",
          deadline: new Date().toISOString().split("T")[0],
          project_id: projId,
        }
      ];
      setWeeks(fallbackWeeks);
      setSubmissions([]);
      setSelectedWeekId("default");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelected = (id: string, project: Project) => {
    setActiveProject(project);
    loadDataForProject(id);
  };

  // Find submission for currently selected week
  const currentSubmission = submissions.find((s) => s.week_id === selectedWeekId) || null;
  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || null;

  // Handle Create or Update
  const handleSubmit = async (formData: FormData) => {
    if (!activeProject) return;
    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      formData.append("project_id", activeProject.id);

      if (isEditing && currentSubmission) {
        // Update existing submission
        const res = await submissionsAPI.update(currentSubmission.id, formData);
        setFeedbackMsg({ type: "success", text: "Submission updated successfully!" });
        setIsEditing(false);
        // Reload submissions
        await loadDataForProject(activeProject.id, selectedWeekId);
      } else {
        // Create new submission
        await submissionsAPI.create(formData);
        setFeedbackMsg({ type: "success", text: "Project submitted successfully!" });
        setIsEditing(false);
        // Reload submissions
        await loadDataForProject(activeProject.id, selectedWeekId);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Submission failed. Please try again.";
      setFeedbackMsg({ type: "error", text: msg });
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExistingScreenshot = async (fileId: string) => {
    if (!currentSubmission) return;
    await submissionsAPI.deleteScreenshot(currentSubmission.id, fileId);
    // Refresh submissions
    if (activeProject) {
      await loadDataForProject(activeProject.id, selectedWeekId);
    }
  };

  return (
    <AuthGuard requiredRole="candidate">
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-black text-gray-900">
              Submit Project
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Submit your GitHub repository, deployed website, project objectives, and screenshots
            </p>
          </motion.div>

          {/* Project Selector Bar */}
          <ProjectSelector
            activeProjectId={queryProjectId || undefined}
            onProjectChange={handleProjectSelected}
            activeSection="submit"
          />

          {/* Feedback Toast */}
          <AnimatePresence>
            {feedbackMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-2.5 text-sm font-semibold shadow-sm border ${
                  feedbackMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                <CheckCircle2 size={18} className={feedbackMsg.type === "success" ? "text-emerald-600" : "text-red-500"} />
                <span>{feedbackMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {activeProject && (
            <>
              {loading ? (
                <div className="py-8">
                  <LoadingSkeleton rows={4} />
                </div>
              ) : (
                <div className="space-y-6">

                  {/* Submission View OR Submission Form */}
                  <AnimatePresence mode="wait">
                    {currentSubmission && !isEditing ? (
                      <motion.div
                        key={`view-${currentSubmission.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <SubmissionDetailView
                          submission={currentSubmission}
                          week={currentWeek}
                          projectName={activeProject.name}
                          onEdit={() => setIsEditing(true)}
                          isAdmin={false}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`form-${selectedWeekId}-${isEditing ? "edit" : "create"}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="card-static bg-white/95 rounded-2xl border border-primary-100 p-8 shadow-sm"
                      >
                        <div className="mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                              <Upload size={20} className="text-primary-600" />
                              <span>
                                {isEditing ? "Edit Submission" : "Submit Project"}
                              </span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isEditing
                                ? "Update your repository, deployed website, objectives, or screenshots"
                                : "Fill in GitHub, deployed website, objectives, and screenshots"}
                            </p>
                          </div>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>

                        <SubmissionForm
                          weeks={weeks}
                          projectId={activeProject.id}
                          projectName={activeProject.name}
                          initialWeekId={selectedWeekId || weeks[0]?.id}
                          initialSubmission={isEditing ? currentSubmission : null}
                          isEdit={isEditing}
                          onSubmit={handleSubmit}
                          onCancel={isEditing ? () => setIsEditing(false) : undefined}
                          submitting={submitting}
                          onDeleteExistingScreenshot={handleDeleteExistingScreenshot}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

export default function SubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SubmitContent />
    </Suspense>
  );
}
