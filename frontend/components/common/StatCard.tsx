"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  /** Icon element */
  icon: ReactNode;
  /** Label shown below the value */
  label: string;
  /** Numeric or string value to display prominently */
  value: string | number;
  /** Tailwind gradient classes for the card background */
  bg?: string;
  /** Animation delay in seconds (for staggered entrance) */
  delay?: number;
  /** Optional sub-label shown below the main label */
  sub?: string;
}

/**
 * Dashboard stat tile — icon + value + label.
 * Replaces the inline `DashboardStat` local components defined inside
 * `app/admin/page.js` and `app/dashboard/page.js`.
 *
 * @example
 * <StatCard
 *   icon={<Users size={20} className="text-primary-600" />}
 *   label="Total Candidates"
 *   value={42}
 *   bg="from-primary-50 to-primary-100/50"
 *   delay={0}
 * />
 */
export default function StatCard({
  icon,
  label,
  value,
  bg = "from-gray-50 to-gray-100/50",
  delay = 0,
  sub,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.08 }}
      className={`card-static rounded-2xl p-5 bg-gradient-to-br ${bg} border border-white/60 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl bg-white/80 shadow-sm">{icon}</div>
      </div>
      <p className="text-3xl font-black text-gray-900 tracking-tight">
        {value}
      </p>
      <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
        {label}
      </p>
      {sub && (
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{sub}</p>
      )}
    </motion.div>
  );
}
