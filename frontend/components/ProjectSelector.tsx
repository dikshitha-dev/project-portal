"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Project, projectsAPI } from "@/lib/api";
import Input from "./Input";
import {
  FolderKanban,
  ChevronDown,
  Kanban,
  Upload,
  Star,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";

interface ProjectSelectorProps {
  activeProjectId?: string;
  onProjectChange?: (projectId: string, project: Project) => void;
  activeSection?: "roadmap" | "submit" | "grades";
}

export default function ProjectSelector({
  activeProjectId,
  onProjectChange,
  activeSection,
}: ProjectSelectorProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>(activeProjectId || "");
  const [loading, setLoading] = useState(true);

  // Join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      try {
        const res = await projectsAPI.getAll();
        const list = res.data.projects || [];
        setProjects(list);

        let initial = activeProjectId;
        if (!initial && typeof window !== "undefined") {
          initial = localStorage.getItem("activeProjectId") || undefined;
        }
        if (!initial && list.length > 0) {
          initial = list[0].id;
        }

        if (initial) {
          const match = list.find((p) => p.id === initial) || list[0];
          if (match) {
            setSelectedId(match.id);
            localStorage.setItem("activeProjectId", match.id);
            if (onProjectChange) onProjectChange(match.id, match);
          }
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedProjects();
  }, [activeProjectId]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedId(newId);
    localStorage.setItem("activeProjectId", newId);
    const p = projects.find((proj) => proj.id === newId);
    if (p && onProjectChange) {
      onProjectChange(newId, p);
    }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoinBusy(true);
    setJoinMsg(null);
    try {
      const res = await projectsAPI.submitJoinRequest(inviteCode.trim().toUpperCase());
      setJoinMsg({
        type: "success",
        text: res.data.message || "Join request submitted! Awaiting admin approval.",
      });
      setInviteCode("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid invite code or unable to submit join request.";
      setJoinMsg({ type: "error", text: msg });
    } finally {
      setJoinBusy(false);
    }
  };

  const currentProject = projects.find((p) => p.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-white/70 rounded-2xl border border-gray-200 text-xs text-gray-500 animate-pulse">
        <FolderKanban size={16} className="text-primary-400" />
        <span>Loading assigned projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        <div className="card-static text-center py-12 px-6 border-2 border-dashed border-primary-200/80 rounded-2xl bg-white/70 shadow-sm max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            No projects assigned yet
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
            You must be an approved member of a project to access its roadmap, submit deliverables, and view grades.
          </p>
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-primary text-xs py-2 px-4 rounded-xl shadow-glow inline-flex items-center gap-2"
          >
            <KeyRound size={14} />
            <span>Join with Invite Code</span>
          </button>
        </div>

        {/* Join Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-primary-100 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound size={18} className="text-primary-600" />
                  <h4 className="font-bold text-gray-900 text-base">Join Project with Code</h4>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              {joinMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    joinMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {joinMsg.type === "success" ? (
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-red-600 flex-shrink-0" />
                  )}
                  <span>{joinMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleJoinProject} className="space-y-4">
                <div>
                  <Input
                    label="Invite Code"
                    type="text"
                    required
                    placeholder="e.g. 9F3B7C2A"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="text-center uppercase font-mono tracking-widest text-lg"
                  />
                  <p className="text-[11px] text-gray-500 mt-2 text-center">
                    Enter the invite code shared by your project administrator. A valid code creates a join request for approval.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-3.5 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={joinBusy || !inviteCode.trim()}
                    className="btn-primary text-xs py-2 px-4 rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    {joinBusy && <Loader2 size={13} className="animate-spin" />}
                    <span>Send Join Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white/90 backdrop-blur-md rounded-2xl border border-primary-100/80 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
          <FolderKanban size={18} />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 block">
            Active Project
          </span>
          <div className="relative inline-block">
            <select
              value={selectedId}
              onChange={handleSelect}
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

      {/* Quick Navigation tabs for the selected project */}
      <div className="flex items-center gap-1 self-end sm:self-center">

        <button
          onClick={() => router.push(`/projects/${selectedId}?tab=submit`)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSection === "submit"
              ? "bg-primary-100 text-primary-800"
              : "text-gray-600 hover:text-primary-700 hover:bg-gray-100"
          }`}
          title="Submit Project"
        >
          <Upload size={13} />
          <span className="hidden sm:inline">Submit</span>
        </button>

        <button
          onClick={() => router.push(`/projects/${selectedId}?tab=grades`)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSection === "grades"
              ? "bg-primary-100 text-primary-800"
              : "text-gray-600 hover:text-primary-700 hover:bg-gray-100"
          }`}
          title="My Grades"
        >
          <Star size={13} />
          <span className="hidden sm:inline">Grades</span>
        </button>
      </div>
    </div>
  );
}
