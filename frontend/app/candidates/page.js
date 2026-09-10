"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout, AuthGuard, LoadingSkeleton, SearchInput } from "@/components";
import { authAPI, submissionsAPI, gradesAPI } from "@/lib/api";
import { Search, Mail, ExternalLink } from "lucide-react";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [candsRes, subsRes, gradesRes] = await Promise.all([
          authAPI.getCandidates(),
          submissionsAPI.getAll(),
          gradesAPI.getAll(),
        ]);
        setCandidates(candsRes.data.candidates);
        setSubmissions(subsRes.data.submissions);
        setGrades(gradesRes.data.grades);
      } catch (err) {
        console.error("Failed to load candidates:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = candidates.filter((c) =>
    (c.name || c.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const getCandidateGrade = (candidateId) => {
    const candidateGrades = grades.filter((g) => g.user?.id === candidateId && g.published);
    if (candidateGrades.length === 0) return { total: "—", grade: "—" };
    const avg = candidateGrades.reduce((sum, g) => sum + g.total, 0) / candidateGrades.length;
    const overall = candidateGrades[candidateGrades.length - 1];
    return { total: Math.round(avg), grade: overall?.grade || "—" };
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingSkeleton rows={6} />
      </AppLayout>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900">Candidates</h1>
              <p className="text-gray-500 mt-1">Manage and track all candidates</p>
            </div>
            <div className="w-64">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                placeholder="Search candidates..."
              />
            </div>
          </motion.div>

          {filtered.length === 0 ? (
            <div className="card-static text-center py-20 text-gray-400">No candidates found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((candidate, i) => {
                const grade = getCandidateGrade(candidate.id);
                const candidateSubs = submissions.filter((s) => s.user_id === candidate.id);
                return (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card group"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-glow">
                          {(candidate.name || candidate.username || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{candidate.name || candidate.username || "Candidate"}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail size={11} /> {candidate.email || "No email provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100/80">
                      <div className="text-center">
                        <div className="text-xl font-black text-gray-900">{candidateSubs.length}</div>
                        <div className="text-[10px] text-gray-500 font-medium">Submissions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-black text-gray-900">{grade.total}</div>
                        <div className="text-[10px] text-gray-500 font-medium">Avg Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-black gradient-text">{grade.grade}</div>
                        <div className="text-[10px] text-gray-500 font-medium">Grade</div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <a
                        href={`/review?candidate=${candidate.id}`}
                        className="btn-secondary w-full text-center block text-sm py-2.5"
                      >
                        <ExternalLink size={14} className="inline mr-1.5" />
                        View Submission
                      </a>
                    </div>
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
