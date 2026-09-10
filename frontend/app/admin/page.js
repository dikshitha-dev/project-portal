"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout, AuthGuard, LoadingSkeleton, SearchInput } from "@/components";
import { gradesAPI, submissionsAPI, weeksAPI, authAPI } from "@/lib/api";
import { Users, ClipboardList, Calendar, Star, Search } from "lucide-react";

function AdminDashboardContent() {
  const [stats, setStats] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, subsRes, weeksRes, candsRes, gradesRes] = await Promise.all([
          gradesAPI.getOverviewStats().catch(() => ({ data: {} })),
          submissionsAPI.getAll().catch(() => ({ data: { submissions: [] } })),
          weeksAPI.getAll().catch(() => ({ data: { weeks: [] } })),
          authAPI.getCandidates().catch(() => ({ data: { candidates: [] } })),
          gradesAPI.getAll().catch(() => ({ data: { grades: [] } })),
        ]);
        setStats(statsRes.data || {});
        setSubmissions(subsRes.data?.submissions || []);
        setWeeks(weeksRes.data?.weeks || []);
        setCandidates(candsRes.data?.candidates || []);
        setGrades(gradesRes.data?.grades || []);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const gradeMap = {};
  grades.forEach((g) => {
    if (g.week && g.user) {
      gradeMap[`${g.week.id}-${g.user.id}`] = g.grade;
    }
  });

  const filteredSubmissions = submissions.filter((sub) => {
    const query = search.toLowerCase();
    return (
      !query ||
      sub.user?.name?.toLowerCase().includes(query) ||
      sub.week?.week_title?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <AppLayout>
        <LoadingSkeleton rows={4} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor candidates, reviews, and progress</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <DashboardStat icon={<Users size={20} className="text-primary-600" />} label="Total Candidates" value={stats.total_candidates || 0} bg="from-primary-50 to-primary-100/50" delay={0} />
          <DashboardStat icon={<ClipboardList size={20} className="text-amber-600" />} label="Pending Reviews" value={stats.pending_reviews || 0} bg="from-amber-50 to-amber-100/50" delay={1} />
          <DashboardStat icon={<Calendar size={20} className="text-blue-600" />} label="Total Weeks" value={weeks.length} bg="from-blue-50 to-blue-100/50" delay={2} />
          <DashboardStat icon={<Star size={20} className="text-emerald-600" />} label="Average Grade" value={stats.average_grade || 0} bg="from-emerald-50 to-emerald-100/50" delay={3} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-static"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Recent Submissions</h3>
            <div className="w-56">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                placeholder="Search..."
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100/80 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-semibold">Candidate</th>
                  <th className="pb-3 pr-4 font-semibold">Week</th>
                  <th className="pb-3 pr-4 font-semibold">Screenshots</th>
                  <th className="pb-3 pr-4 font-semibold">Grade</th>
                  <th className="pb-3 pr-4 font-semibold">Submitted</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No submissions found
                    </td>
                  </tr>
                )}
                {filteredSubmissions.map((sub) => {
                  const grade = gradeMap[`${sub.week?.id}-${sub.user?.id}`] || gradeMap[`${sub.week_id}-${sub.user_id}`];
                  return (
                    <tr key={sub.id} className="border-b border-gray-50/80 hover:bg-white/40 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-gray-900">{sub.user?.name}</td>
                      <td className="py-3.5 pr-4 text-gray-600">{sub.week?.week_title}</td>
                      <td className="py-3.5 pr-4">
                        <span className="badge-purple">{sub.review_files?.length || 0}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        {grade ? (
                          <span className="badge-purple">{grade}</span>
                        ) : (
                          <span className="badge-yellow">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <a
                          href={`/review?submission=${sub.id}`}
                          className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 hover:text-primary-600 font-semibold"
                        >
                          View Submission
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

function DashboardStat({ icon, label, value, bg, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="card-static group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center group-hover:shadow-glow transition-shadow duration-300`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboardContent />
    </AuthGuard>
  );
}
