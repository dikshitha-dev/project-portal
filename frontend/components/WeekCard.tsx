"use client";

import { ReactNode } from "react";
import { Calendar, Clock } from "lucide-react";
import { Week } from "@/lib/api";
import { motion } from "framer-motion";

interface WeekCardProps {
  week: Week;
  onClick?: () => void;
  actions?: ReactNode;
}

function getDeadlineStatus(deadline: string): {
  label: string;
  className: string;
  glow: string;
} {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Overdue", className: "badge-red", glow: "shadow-red-200" };
  }
  if (diffDays <= 2) {
    return { label: `${diffDays}d left`, className: "badge-yellow", glow: "shadow-amber-200" };
  }
  return { label: `${diffDays}d left`, className: "badge-green", glow: "shadow-emerald-200" };
}

export default function WeekCard({ week, onClick, actions }: WeekCardProps) {
  const deadline = new Date(week.deadline);
  const status = getDeadlineStatus(week.deadline);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="card cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-glow">
            {week.week_title.replace(/\D/g, "").slice(0, 2) || "?"}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
              {week.week_title}
            </h3>
          </div>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
        {week.objective}
      </p>

      {week.resources && (
        <div className="mb-4 p-3 bg-primary-50/50 rounded-xl border border-primary-100/50">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-1">Resources</p>
          <p className="text-sm text-primary-700">{week.resources}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100/80">
        <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Calendar size={13} className="text-primary-400" />
          {deadline.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className={`flex items-center gap-1.5 ${status.className} text-[11px]`}>
          <Clock size={12} />
          {status.label}
        </span>
      </div>
    </motion.div>
  );
}
