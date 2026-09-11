"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { profilesService, MentorAssignment } from "@/lib/services/profiles";
import { submissionsService } from "@/lib/services/submissions";
import { gradesService } from "@/lib/services/grades";
import { Submission, Grade } from "@/types";
import { Users, FileText, CheckCircle2, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export default function MentorDashboardPage() {
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const assignList = await profilesService.getMentorAssignments();
        setAssignments(assignList);

        const { submissions: subList } = await submissionsService.getAll();
        setSubmissions(subList);
      } catch (err) {
        console.error("Failed to load mentor dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AuthGuard requiredRole="mentor">
      <div className="min-h-screen bg-gray-50/50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-primary-600" size={24} />
                Mentor Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review assigned candidates, submissions, and evaluation rubrics.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" text="Loading mentor data..." />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">Assigned Candidates</p>
                      <h3 className="text-2xl font-bold text-gray-900">{assignments.length}</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">Pending Reviews</p>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {submissions.filter((s) => !s.grade).length}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">Graded Submissions</p>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {submissions.filter((s) => s.grade).length}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submissions Section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-primary-600" />
                  Assigned Submissions
                </h2>

                {submissions.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">No submissions available for review yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="py-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {sub.user?.name || "Candidate"} — {sub.week?.week_title || "Weekly Progress"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Status: <span className="font-medium text-primary-600">{sub.status || "Submitted"}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/review?submissionId=${sub.id}`}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors"
                          >
                            Review & Annotate
                          </Link>
                          <Link
                            href={`/grades?submissionId=${sub.id}`}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-xl transition-colors"
                          >
                            Grade Rubric
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
