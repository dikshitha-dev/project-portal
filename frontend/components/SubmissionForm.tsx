"use client";

import { FormEvent, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Send,
  AlertCircle,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Globe,
  Github,
} from "lucide-react";
import { Week, Submission, ReviewFile } from "@/lib/api";
import FileUpload, { UploadedFile } from "./FileUpload";
import Input from "./Input";
import Textarea from "./Textarea";

export interface SubmissionFormValues {
  week_id: string;
  github_url: string;
  deployed_url: string;
  linkedin_url: string;
  project_description: string;
  what_learned: string;
  difficulties_faced: string;
}

interface SubmissionFormProps {
  weeks: Week[];
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  projectId?: string;
  projectName?: string;
  initialWeekId?: string;
  initialSubmission?: Submission | null;
  isEdit?: boolean;
  onDeleteExistingScreenshot?: (fileId: string) => Promise<void>;
}

const EMPTY_VALUES: SubmissionFormValues = {
  week_id: "",
  github_url: "",
  deployed_url: "",
  linkedin_url: "",
  project_description: "",
  what_learned: "",
  difficulties_faced: "",
};

const MAX_OBJECTIVES_LENGTH = 5000;
const MAX_SCREENSHOTS = 5;

function isValidHttpUrl(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFullImageUrl(url: string): string {
  if (!url) return "";
  return url;
}

export default function SubmissionForm({
  weeks,
  onSubmit,
  onCancel,
  submitting = false,
  projectId,
  projectName,
  initialWeekId,
  initialSubmission,
  isEdit = false,
  onDeleteExistingScreenshot,
}: SubmissionFormProps) {
  const [values, setValues] = useState<SubmissionFormValues>({
    ...EMPTY_VALUES,
    week_id: initialWeekId || (weeks[0]?.id ?? ""),
  });
  const [screenshots, setScreenshots] = useState<UploadedFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<ReviewFile[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SubmissionFormValues | "screenshots", string>>
  >({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialSubmission) {
      setValues({
        week_id: initialSubmission.week_id || initialWeekId || (weeks[0]?.id ?? ""),
        github_url: initialSubmission.github_url || "",
        deployed_url: initialSubmission.deployed_url || "",
        linkedin_url: initialSubmission.linkedin_url || "",
        project_description:
          initialSubmission.project_description || initialSubmission.reflection || "",
        what_learned: initialSubmission.what_learned || "",
        difficulties_faced: initialSubmission.difficulties_faced || "",
      });
      setExistingFiles(initialSubmission.review_files || []);
    } else if (initialWeekId) {
      setValues((p) => ({ ...p, week_id: initialWeekId }));
    } else if (!values.week_id && weeks.length > 0) {
      setValues((p) => ({ ...p, week_id: weeks[0].id }));
    }
  }, [initialSubmission, initialWeekId, weeks]);

  const isBusy = busy || submitting;
  const totalScreenshots = existingFiles.length + screenshots.length;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof SubmissionFormValues | "screenshots", string>> = {};

    if (!values.week_id) {
      next.week_id = "Please select a target milestone week.";
    }

    const gh = values.github_url.trim();
    if (!gh) {
      next.github_url = "GitHub repository URL is required.";
    } else if (!isValidHttpUrl(gh)) {
      next.github_url =
        "Please enter a valid URL (e.g. https://github.com/username/project).";
    }

    const dep = values.deployed_url.trim();
    if (!dep) {
      next.deployed_url = "Deployed website URL is required.";
    } else if (!isValidHttpUrl(dep)) {
      next.deployed_url =
        "Please enter a valid URL (e.g. https://project.vercel.app).";
    }

    if (values.linkedin_url?.trim() && !isValidHttpUrl(values.linkedin_url.trim())) {
      next.linkedin_url = "Please enter a valid URL (https://...).";
    }

    const objectives = values.project_description.trim();
    if (!objectives) {
      next.project_description = "Project objectives are required.";
    } else if (objectives.length > MAX_OBJECTIVES_LENGTH) {
      next.project_description = `Please keep objectives under ${MAX_OBJECTIVES_LENGTH} characters.`;
    }

    if (totalScreenshots < 1) {
      next.screenshots = "Please upload at least one project screenshot.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();
    formData.append("week_id", values.week_id);
    if (projectId) formData.append("project_id", projectId);
    formData.append("github_url", values.github_url.trim());
    formData.append("deployed_url", values.deployed_url.trim());
    if (values.linkedin_url?.trim()) {
      formData.append("linkedin_url", values.linkedin_url.trim());
    }

    const objectives = values.project_description.trim();
    formData.append("project_description", objectives);
    // Keep legacy fields intact when editing older submissions
    formData.append("what_learned", values.what_learned.trim());
    formData.append("difficulties_faced", values.difficulties_faced.trim());
    formData.append("reflection", `Project Objectives:\n${objectives}`);

    screenshots.forEach((s) => formData.append("screenshots", s.file));
    return formData;
  };

  const handleDeleteExisting = async (fileId: string) => {
    if (onDeleteExistingScreenshot) {
      try {
        await onDeleteExistingScreenshot(fileId);
        setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
        setErrors((prev) => ({ ...prev, screenshots: undefined }));
      } catch (err) {
        console.error("Failed to delete screenshot:", err);
      }
    } else {
      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
      setErrors((prev) => ({ ...prev, screenshots: undefined }));
    }
  };

  const handleScreenshotsChange = (files: UploadedFile[]) => {
    setScreenshots(files);
    setErrors((prev) => ({ ...prev, screenshots: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!validate()) return;
    setBusy(true);
    try {
      await onSubmit(buildFormData());
      setSuccess(true);
      setScreenshots([]);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Submission failed. Please check your inputs and try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200/60 bg-red-50/80 backdrop-blur-sm px-4 py-3 text-sm text-red-700 font-medium"
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/90 backdrop-blur-sm px-4 py-3 text-sm text-emerald-700 font-medium"
        >
          <CheckCircle2 size={16} />
          <span>Project submitted successfully!</span>
        </motion.div>
      )}

      {/* Project context — keep week_id for API, hide picker when only one week */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50/90 via-indigo-50/70 to-purple-50/80 border border-primary-100 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary-700 uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full border border-primary-200">
            Project: {projectName || "Active Project"}
          </span>
          {isEdit && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Editing Submission
            </span>
          )}
        </div>

        <input type="hidden" name="week_id" value={values.week_id} />
      </div>

      {/* Submit Project form fields */}
      <div className="card-static rounded-2xl p-6 bg-white border border-gray-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900">Submit Project</h3>
          <span className="text-xs text-gray-400 font-medium">Required fields *</span>
        </div>

        {/* 1. GitHub Repository */}
        <div>
          <Input
            label="GitHub Repository"
            required
            name="github_url"
            type="url"
            value={values.github_url}
            onChange={handleChange}
            icon={<Github size={16} />}
            placeholder="Enter GitHub repository URL"
            disabled={isBusy}
            error={errors.github_url}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Must be a valid http(s) URL — e.g. https://github.com/username/repo
          </p>
        </div>

        {/* 2. Deployed Website */}
        <div>
          <Input
            label="Deployed Website"
            required
            name="deployed_url"
            type="url"
            value={values.deployed_url}
            onChange={handleChange}
            icon={<Globe size={16} />}
            placeholder="Enter deployed website URL"
            disabled={isBusy}
            error={errors.deployed_url}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Must be a valid http(s) URL — opens in a new tab after submission
          </p>
        </div>

        {/* 3. Project Objectives */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="project_description" className="label mb-0">
              Project Objectives <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-gray-400 font-medium">
              {values.project_description.length}/{MAX_OBJECTIVES_LENGTH}
            </span>
          </div>
          <Textarea
            id="project_description"
            name="project_description"
            rows={6}
            value={values.project_description}
            onChange={handleChange}
            placeholder="Describe the objectives of your project..."
            disabled={isBusy}
            error={errors.project_description}
            maxLength={MAX_OBJECTIVES_LENGTH}
          />
        </div>

        {/* 4. Project Screenshots */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-primary-600" />
              <span>
                Project Screenshots <span className="text-red-500">*</span>
              </span>
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Upload Screenshots — PNG, JPG, JPEG, or WEBP up to 5MB each (max {MAX_SCREENSHOTS})
            </p>
          </div>

          {existingFiles.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">
                Currently Attached Screenshots
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {existingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFullImageUrl(file.image_url)}
                      alt={file.file_name || "Existing screenshot"}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteExisting(file.id)}
                      className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-full shadow transition-all opacity-0 group-hover:opacity-100"
                      title="Remove this screenshot"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FileUpload
            files={screenshots}
            onChange={handleScreenshotsChange}
            maxFiles={Math.max(0, MAX_SCREENSHOTS - existingFiles.length)}
            label="Upload Screenshots"
          />

          {errors.screenshots && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle size={13} />
              {errors.screenshots}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="btn-secondary w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
        )}

        <motion.button
          type="submit"
          disabled={isBusy}
          whileHover={{ scale: isBusy ? 1 : 1.01 }}
          whileTap={{ scale: isBusy ? 1 : 0.99 }}
          className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{isEdit ? "Saving Changes..." : "Submitting Project..."}</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>{isEdit ? "Save Changes" : "Submit Project"}</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
