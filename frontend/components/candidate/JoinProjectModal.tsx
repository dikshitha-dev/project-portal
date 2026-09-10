"use client";

import React, { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import Modal from "@/components/common/Modal";
import { Input } from "@/components";
import { projectsAPI } from "@/lib/api";

interface JoinProjectModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when a project is successfully joined or a request is submitted */
  onSuccess: (projectId: string, projectName: string, message: string) => void;
}

interface JoinMessage {
  type: "success" | "error";
  text: string;
}

/**
 * Invite-code join modal for candidates.
 * Extracted from app/dashboard/page.js to reduce its size.
 *
 * @example
 * <JoinProjectModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={(id, name, msg) => { ... }}
 * />
 */
export default function JoinProjectModal({
  open,
  onClose,
  onSuccess,
}: JoinProjectModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<JoinMessage | null>(null);

  const handleClose = () => {
    setInviteCode("");
    setMessage(null);
    onClose();
  };

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setMessage({ type: "error", text: "Please enter an invite code." });
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const res = await projectsAPI.submitJoinRequest(code);
      const { project_id, project_name, message: serverMsg } = res.data;
      setMessage({ type: "success", text: serverMsg || "Request submitted!" });

      setTimeout(() => {
        if (project_id) {
          onSuccess(project_id, project_name || "Project", serverMsg || "");
        }
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Invalid invite code. Please try again.";
      setMessage({ type: "error", text: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !busy) handleJoin();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Join Project with Invite Code"
      subtitle="Enter the invite code provided by your mentor"
    >
      <div className="space-y-4">
        <div className="relative">
          <Input
            label="Invite Code"
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="e.g. B69E5DA0"
            disabled={busy}
            icon={<KeyRound size={16} />}
          />
        </div>

        {message && (
          <p
            className={`text-xs font-semibold px-3 py-2 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="btn-secondary flex-1 py-2.5 rounded-xl text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleJoin}
            disabled={busy || !inviteCode.trim()}
            className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Joining...
              </>
            ) : (
              "Join Project"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
