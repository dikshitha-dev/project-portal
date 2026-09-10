"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { reviewsAPI } from "@/lib/api";
import { IssueCard } from "@/components";
import { Input, Textarea } from "@/components";
import type { Issue } from "@/types";

interface IssueBoardProps {
  issues: Issue[];
  submissionId: string | null;
  selectedAnnotationId: string | null;
  activeImageId: string | null;
  /** Called when an annotation needs to be saved before creating an issue */
  onAnnotationSave?: (annotationId: string) => void;
  onIssueCreate: (issue: Issue) => void;
  onIssueUpdate: (id: string, updated: Issue) => void;
  onIssueDelete: (id: string) => void;
}

interface IssueFormValues {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  mark_deduction: number;
}

const EMPTY_FORM: IssueFormValues = {
  title: "",
  description: "",
  priority: "Medium",
  mark_deduction: 0,
};

/**
 * Issue board component for the admin review workspace.
 * Handles issue creation (linked to the selected annotation) and displays
 * the list of existing issues for the current submission.
 *
 * Extracted from app/review/page.js to reduce its size.
 */
export default function IssueBoard({
  issues,
  submissionId,
  selectedAnnotationId,
  activeImageId,
  onIssueCreate,
  onIssueUpdate,
  onIssueDelete,
}: IssueBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<IssueFormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!selectedAnnotationId || !form.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await reviewsAPI.createIssue({
        annotation_id: selectedAnnotationId,
        ...form,
      });
      onIssueCreate(res.data.issue);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Failed to create issue:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Issue>) => {
    try {
      const res = await reviewsAPI.updateIssue(id, data);
      onIssueUpdate(id, res.data.issue);
    } catch (err) {
      console.error("Failed to update issue:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reviewsAPI.deleteIssue(id);
      onIssueDelete(id);
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Issue Creation Form */}
      <AnimatePresence>
        {showForm && selectedAnnotationId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-static border border-primary-200/80 bg-white/95"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                <span>Create Issue for Selected Annotation</span>
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Close issue form"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Issue title (e.g. Broken navigation button)"
                required
              />
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Detailed issue description and expected behavior..."
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as IssueFormValues["priority"] })
                    }
                    className="input-field text-xs py-1.5"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                    Mark Deduction
                  </label>
                  <Input
                    type="number"
                    value={form.mark_deduction}
                    onChange={(e) =>
                      setForm({ ...form, mark_deduction: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                    min={0}
                    step={0.5}
                  />
                </div>
                <div className="flex items-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={!form.title.trim() || submitting}
                    className="btn-primary w-full py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    Save Issue
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issue Board Header */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
          <span>Issue Board</span>
          <div className="flex items-center gap-2">
            {issues.length > 0 && (
              <span className="text-xs text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full font-semibold">
                {issues.length} {issues.length === 1 ? "issue" : "issues"}
              </span>
            )}
            {selectedAnnotationId && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-secondary py-1 px-2.5 rounded-lg text-xs flex items-center gap-1"
                title="Create issue for selected annotation"
              >
                <Plus size={12} />
                Add Issue
              </button>
            )}
          </div>
        </h3>

        {issues.length === 0 ? (
          <div className="card-static text-center py-10 text-gray-400 text-xs">
            No issues created yet. Select any annotation to link an issue.
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onUpdate={handleUpdate}
                onDelete={() => handleDelete(issue.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
