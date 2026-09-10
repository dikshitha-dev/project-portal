"use client";

import { motion } from "framer-motion";

export default function GradeCard({ grade, showDetails }) {
  const gradeColor = {
    "A+": "from-emerald-400 to-emerald-600",
    A: "from-green-400 to-green-600",
    B: "from-blue-400 to-blue-600",
    C: "from-amber-400 to-amber-600",
    "Needs Improvement": "from-red-400 to-red-600",
  };

  const gradeTextColor = {
    "A+": "text-emerald-600",
    A: "text-green-600",
    B: "text-blue-600",
    C: "text-amber-600",
    "Needs Improvement": "text-red-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-900">
            {grade.week?.week_title || "Week Grade"}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(grade.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className={`text-2xl font-black px-5 py-2.5 rounded-2xl text-white bg-gradient-to-br ${
          gradeColor[grade.grade] || "from-gray-400 to-gray-600"
        } shadow-lg`}>
          {grade.grade}
        </div>
      </div>

      <div className="text-center mb-5 py-4 bg-gradient-to-br from-primary-50/80 to-primary-100/50 rounded-2xl">
        <span className="text-4xl font-black text-gray-900">{grade.total}</span>
        <span className="text-gray-500 text-lg font-medium">/100</span>
      </div>

      {showDetails && (
        <div className="space-y-3 pt-4 border-t border-gray-100/80">
          <ScoreRow label="UI / UX" score={grade.ui} max={20} />
          <ScoreRow label="Functionality" score={grade.functionality} max={25} />
          <ScoreRow label="GitHub Quality" score={grade.github} max={15} />
          <ScoreRow label="Documentation" score={grade.documentation} max={10} />
          <ScoreRow label="Innovation" score={grade.innovation} max={20} />
          <ScoreRow label="Weekly Progress" score={grade.weekly_progress} max={10} />
        </div>
      )}
    </motion.div>
  );
}

function ScoreRow({ label, score, max }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
          />
        </div>
        <span className="text-gray-900 font-bold w-14 text-right">
          {score}/{max}
        </span>
      </div>
    </div>
  );
}
