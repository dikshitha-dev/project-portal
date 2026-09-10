// ─── Layout ───────────────────────────────────────────────────────────────────
export { default as AppLayout } from "./AppLayout";
export { default as Navbar } from "./Navbar";
export { default as Sidebar } from "./Sidebar";
export { default as AuthGuard } from "./AuthGuard";

// ─── Common / Reusable UI ─────────────────────────────────────────────────────
export { default as Badge, inferVariant } from "./common/Badge";
export { default as EmptyState } from "./common/EmptyState";
export { default as Modal } from "./common/Modal";
export { default as StatCard } from "./common/StatCard";

// ─── Form Controls ────────────────────────────────────────────────────────────
export { default as Input } from "./Input";
export type { InputProps } from "./Input";
export { default as Textarea } from "./Textarea";
export type { TextareaProps } from "./Textarea";
export { default as SearchInput } from "./SearchInput";
export type { SearchInputProps } from "./SearchInput";
export { default as FileUpload } from "./FileUpload";
export type { UploadedFile } from "./FileUpload";

// ─── Data Display ─────────────────────────────────────────────────────────────
export { default as WeekCard } from "./WeekCard";
export { default as WeekForm } from "./WeekForm";
export type { WeekFormData } from "./WeekForm";
export { default as SubmissionForm } from "./SubmissionForm";
export { default as SubmissionDetailView } from "./SubmissionDetailView";
export { default as ReflectionBox } from "./ReflectionBox";
export { default as GradeCard } from "./GradeCard";
export { default as IssueCard } from "./IssueCard";
export { default as ProgressChart } from "./ProgressChart";
export { default as ProjectSelector } from "./ProjectSelector";

// ─── Review Workspace Sub-Components ────────────────────────────────────────
export { default as SubmissionSelector } from "./review/SubmissionSelector";
export { default as IssueBoard } from "./review/IssueBoard";

// ─── Candidate Sub-Components ────────────────────────────────────────────────
export { default as JoinProjectModal } from "./candidate/JoinProjectModal";

// ─── Canvas & Annotations ─────────────────────────────────────────────────────
export { default as AnnotationToolbar } from "./AnnotationToolbar";

// ─── Loading & Feedback ───────────────────────────────────────────────────────
export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as LoadingSkeleton } from "./LoadingSkeleton";