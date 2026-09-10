"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/utils/formatters";
import {
  LogOut,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Check,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NotificationItem } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNotifIcon(type: string) {
  switch (type) {
    case "join_request":
      return <UserPlus size={16} className="text-primary-600" />;
    case "join_approved":
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    case "join_rejected":
      return <AlertCircle size={16} className="text-red-500" />;
    default:
      return <Bell size={16} className="text-primary-500" />;
  }
}

// ─── Sub-component: Notification Item ─────────────────────────────────────────

interface NotifItemProps {
  notif: NotificationItem;
  onRead: (id: string, link?: string | null) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

function NotifItem({ notif, onRead, onDelete }: NotifItemProps) {
  return (
    <div
      onClick={() => onRead(notif.id, notif.link)}
      className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-gray-50/80 ${
        !notif.is_read ? "bg-primary-50/30" : "bg-white"
      }`}
    >
      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/60 shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
        {getNotifIcon(notif.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p
            className={`text-xs ${
              !notif.is_read ? "font-bold text-gray-900" : "font-semibold text-gray-700"
            } truncate`}
          >
            {notif.title}
          </p>
          <span className="text-[10px] text-gray-400 whitespace-nowrap">
            {formatRelativeTime(notif.created_at)}
          </span>
        </div>
        <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
      </div>
      <button
        onClick={(e) => onDelete(e, notif.id)}
        className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors flex-shrink-0"
        title="Dismiss"
        aria-label="Dismiss notification"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refresh } =
    useNotifications(!!user);

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  const handleDropdownToggle = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) refresh();
  };

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    await markAsRead(id);
    if (link) {
      setShowNotifications(false);
      router.push(link);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleLogout = () => logout();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-white/50"
      style={{
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.02), 0 8px 20px -8px rgba(124, 58, 237, 0.06)",
      }}
    >
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              Project Portal
            </span>
            <span className="hidden sm:block text-[10px] text-gray-400 font-medium tracking-wider uppercase">
              Mentorship Hub
            </span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleDropdownToggle}
                  className="relative p-2.5 rounded-xl bg-white/60 hover:bg-white border border-gray-200/80 hover:border-primary-300 text-gray-600 hover:text-primary-600 transition-all duration-200 shadow-sm"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                      style={{
                        boxShadow:
                          "0 20px 40px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Header */}
                      <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">
                            Notifications
                          </h4>
                          {unreadCount > 0 && (
                            <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                          >
                            <Check size={12} />
                            <span>Mark all as read</span>
                          </button>
                        )}
                      </div>

                      {/* Items */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center text-gray-400 text-xs">
                            <Bell
                              size={28}
                              className="mx-auto mb-2 text-gray-300"
                            />
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <NotifItem
                              key={notif.id}
                              notif={notif}
                              onRead={handleMarkAsRead}
                              onDelete={handleDelete}
                            />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User info */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-glow">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {user.name}
                  </p>
                  <span className="badge-purple text-[10px] capitalize">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
