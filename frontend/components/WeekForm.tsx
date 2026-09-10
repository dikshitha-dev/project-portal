"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, X } from "lucide-react";
import { Week } from "@/lib/api";
import Input from "./Input";
import Textarea from "./Textarea";

export interface WeekFormData {
  week_title: string;
  objective: string;
  resources: string;
  deadline: string;
}

interface WeekFormProps {
  initialValues?: Partial<Week>;
  onSubmit: (data: WeekFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function formatDate(date: string): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

const EMPTY_FORM: WeekFormData = {
  week_title: "",
  objective: "",
  resources: "",
  deadline: "",
};

export default function WeekForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}: WeekFormProps) {
  const isEditing = Boolean(initialValues?.id);

  const [form, setForm] = useState<WeekFormData>({
    week_title: initialValues?.week_title ?? "",
    objective: initialValues?.objective ?? "",
    resources: initialValues?.resources ?? "",
    deadline: formatDate(initialValues?.deadline ?? ""),
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.week_title.trim()) {
      setError("Week title is required.");
      return;
    }
    if (!form.objective.trim()) {
      setError("Objective is required.");
      return;
    }
    if (!form.deadline) {
      setError("Deadline is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-static border-primary-200/50"
    >
      <h2 className="font-bold text-gray-900 mb-5 text-lg">
        {isEditing ? "Edit Weekly Roadmap" : "Create Weekly Roadmap"}
      </h2>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm text-red-700 font-medium"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="week_title"
          name="week_title"
          label="Week Title"
          type="text"
          value={form.week_title}
          onChange={handleChange}
          placeholder="Week 3"
          required
          disabled={busy}
        />

        <Textarea
          id="objective"
          name="objective"
          label="Objective"
          value={form.objective}
          onChange={handleChange}
          rows={4}
          placeholder="Build the landing page and responsive nav."
          required
          disabled={busy}
        />

        <Input
          id="resources"
          name="resources"
          label="Resources"
          type="text"
          value={form.resources}
          onChange={handleChange}
          placeholder="Figma, Tailwind Docs, AWS Guidelines"
          disabled={busy}
        />

        <Input
          id="deadline"
          name="deadline"
          label="Deadline"
          type="date"
          value={form.deadline}
          onChange={handleChange}
          required
          disabled={busy}
        />

        <div className="flex items-center gap-3 pt-2">
          <motion.button
            type="submit"
            disabled={busy}
            whileHover={{ scale: busy ? 1 : 1.02 }}
            whileTap={{ scale: busy ? 1 : 0.98 }}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? "Save Changes" : "Create Week"}
              </>
            )}
          </motion.button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
