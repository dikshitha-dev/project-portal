"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import {
  LayoutDashboard,
  Calendar,
  Upload,
  Star,
  Users,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Linkedin,
} from "lucide-react";

// ─── Navigation Config ────────────────────────────────────────────────────────

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const CANDIDATE_LINKS: NavLink[] = [
  { href: ROUTES.CANDIDATE_DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.SUBMIT, label: "Submit Project", icon: Upload },
  { href: ROUTES.LINKEDIN, label: "LinkedIn", icon: Linkedin },
  { href: ROUTES.GRADES, label: "My Grades", icon: Star },
];

const ADMIN_LINKS: NavLink[] = [
  { href: ROUTES.ADMIN_DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.ADMIN_PROJECTS, label: "Projects", icon: Calendar },
  { href: ROUTES.CANDIDATES, label: "Candidates", icon: Users },
  { href: ROUTES.ADMIN_LINKEDIN, label: "LinkedIn Review", icon: Linkedin },
  { href: ROUTES.REVIEW, label: "Review Work", icon: ClipboardList },
  { href: ROUTES.GRADES, label: "Grades", icon: BarChart3 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const links = user?.role === ROLES.ADMIN ? ADMIN_LINKS : CANDIDATE_LINKS;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative min-h-[calc(100vh-57px)] overflow-hidden flex-shrink-0"
      style={{
        background:
          "linear-gradient(180deg, #0f0a24 0%, #1a0f3c 40%, #150d35 100%)",
      }}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-indigo-500 rounded-full blur-[60px]" />
      </div>

      <div className="relative z-10 p-3 pt-6">
        <nav className="space-y-1" aria-label="Main navigation">
          {links.map((link, index) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={link.href}
                  className={`${isActive ? "sidebar-link-active" : "sidebar-link"} ${
                    collapsed ? "justify-center" : ""
                  }`}
                  title={collapsed ? link.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}
