"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Trash2, Edit3, Save, X } from "lucide-react";
import Input from "./Input";
import Textarea from "./Textarea";

export default function IssueCard({ issue, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: issue.title,
    description: issue.description || "",
    priority: issue.priority,
    status: issue.status,
    mark_deduction: issue.mark_deduction || 0,
  });

  const priorityColors = {
    High: "badge-red",
    Medium: "badge-yellow",
    Low: "badge-green",
  };

  const priorityBorders = {
    High: "border-l-red-400",
    Medium: "border-l-amber-400",
    Low: "border-l-emerald-400",
  };

  const handleSave = () => {
    onUpdate(issue.id, form);
    setEditing(false);
  };

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-static border-primary-200/50"
        >
          <div className="space-y-3">
            <Input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Issue title"
            />
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Description"
            />
            <div className="grid grid-cols-3 gap-3">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input-field text-sm"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field text-sm"
              >
                <option>To Do</option>
                <option>Fixed</option>
              </select>
              <Input
                type="number"
                value={form.mark_deduction}
                onChange={(e) =>
                  setForm({ ...form, mark_deduction: parseFloat(e.target.value) })
                }
                placeholder="Mark deduction"
                min="0"
                step="0.5"
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary text-sm py-2 flex items-center gap-1.5"
              >
                <Save size={14} /> Save
              </motion.button>
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary text-sm py-2 flex items-center gap-1.5"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className={`card cursor-pointer border-l-4 ${priorityBorders[issue.priority]}`}
          onClick={() => setEditing(true)}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{issue.title}</h4>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(issue.id);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {issue.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={priorityColors[issue.priority]}>
              {issue.priority}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
              {issue.status === "Fixed" ? (
                <CheckCircle size={13} className="text-emerald-500" />
              ) : (
                <AlertCircle size={13} className="text-amber-500" />
              )}
              {issue.status}
            </span>
            {issue.mark_deduction > 0 && (
              <span className="text-xs text-red-500 font-semibold">
                -{issue.mark_deduction} marks
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
