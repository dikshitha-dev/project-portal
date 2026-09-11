/**
 * Central TypeScript type definitions for the Project Review & Mentorship Portal.
 * Imported by lib/api.ts and all components/hooks.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "mentor" | "candidate";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile_image?: string | null;
  profileImage?: string | null;
  created_at?: string | null;
}

export interface Profile extends User {
  updated_at?: string | null;
}

export interface MentorAssignment {
  id: string;
  mentor_id: string;
  candidate_id: string;
  project_id?: string | null;
  created_at?: string;
  mentor?: User;
  candidate?: User;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterPayload {
  name?: string;
  username?: string;
  email?: string;
  password: string;
  role?: UserRole;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at?: string;
  user?: User;
}

export interface ProjectJoinRequest {
  id: string;
  project_id: string;
  project_name?: string;
  user_id: string;
  status: "pending" | "approved" | "accepted" | "rejected" | "cancelled";
  feedback?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  user?: User;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  public_joining: boolean;
  invite_code: string;
  status: string;
  members_count: number;
  total_members?: number;
  total_weeks?: number;
  current_week?: string;
  progress_percent?: number;
  submitted_weeks?: number;
  created_at: string;
  updated_at?: string;
  is_owner?: boolean;
  membership_status?: "approved" | "pending" | "rejected" | "none";
  user_join_request?: ProjectJoinRequest;
  members?: ProjectMember[];
  join_requests?: ProjectJoinRequest[];
  weeks?: Week[];
}

// ─── Week ─────────────────────────────────────────────────────────────────────

export interface Week {
  id: string;
  project_id?: string | null;
  week_title: string;
  objective: string;
  resources?: string | null;
  deadline: string;
  created_at?: string;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface ReviewFile {
  id: string;
  submission_id: string;
  image_url: string;
  file_name?: string | null;
  created_at?: string;
}

export interface Grade {
  id: string;
  submission_id: string;
  ui: number;
  functionality: number;
  github: number;
  documentation: number;
  innovation: number;
  weekly_progress: number;
  total: number;
  grade: string;
  published: boolean;
  created_at?: string;
}

export interface Submission {
  id: string;
  user_id: string;
  week_id: string;
  project_id?: string | null;
  github_url?: string | null;
  deployed_url?: string | null;
  linkedin_url?: string | null;
  reflection?: string | null;
  project_description?: string | null;
  what_learned?: string | null;
  difficulties_faced?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: User;
  week?: Week;
  review_files?: ReviewFile[];
  grade?: Grade | null;
}

// ─── Annotations & Issues ────────────────────────────────────────────────────

export interface Issue {
  id: string;
  annotation_id: string;
  title: string;
  description?: string | null;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "Fixed";
  reference_file_url?: string | null;
  mark_deduction?: number;
  created_at?: string;
}

export interface Annotation {
  id: string;
  image_id: string;
  tool_type: string;
  coordinates: Record<string, unknown>;
  color: string;
  text?: string | null;
  created_at?: string;
  issue?: Issue | null;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── LinkedIn / Posts ─────────────────────────────────────────────────────────

export interface PostMedia {
  id: string;
  submission_id?: string;
  submissionId?: string;
  image_url: string;
  imageUrl?: string;
  video_url?: string | null;
  videoUrl?: string | null;
  created_at?: string;
  createdAt?: string;
}

export interface PostReview {
  id: string;
  submission_id?: string;
  submissionId?: string;
  admin_id?: string;
  adminId?: string;
  feedback?: string | null;
  reviewed_at?: string;
  reviewedAt?: string;
  decision: "Approved" | "Needs Changes";
  admin?: User;
}

export interface SubmissionActivity {
  id: string;
  submission_id?: string;
  action: string;
  actor_id?: string;
  actor_name?: string;
  details?: string | null;
  created_at?: string;
  createdAt?: string;
}

export interface PostSubmission {
  id: string;
  userId?: string;
  user_id?: string;
  platform: string;
  caption: string;
  status: "Draft" | "Pending Review" | "Approved" | "Needs Changes";
  postingDate?: string | null;
  postingTime?: string | null;
  posting_date?: string | null;
  posting_time?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
  media?: PostMedia[];
  reviews?: PostReview[];
  activities?: SubmissionActivity[];
  latest_review?: PostReview | null;
}
