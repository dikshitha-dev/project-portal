/**
 * Typed Axios API client for the Project Review & Mentorship Portal.
 *
 * All TypeScript interfaces live in `@/types` — this file only contains
 * the Axios instance configuration and the grouped API function objects.
 *
 * Types are re-exported here so existing imports like:
 *   import { User, Submission } from "@/lib/api"
 * continue to work without any changes to consumer files.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  Week,
  Project,
  ProjectMember,
  ProjectJoinRequest,
  NotificationItem,
  Submission,
  Annotation,
  Issue,
  Grade,
  PostSubmission,
} from "@/types";

// ─── Re-export all types (backward compatible) ────────────────────────────────
export type {
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  Week,
  ProjectMember,
  ProjectJoinRequest,
  Project,
  ReviewFile,
  Grade,
  Submission,
  Annotation,
  Issue,
  NotificationItem,
  PostMedia,
  PostReview,
  SubmissionActivity,
  PostSubmission,
} from "@/types";

// ─── Axios Client ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Typed Axios client pre-configured with the backend base URL and JWT handling.
 * Attaches the auth token from localStorage to every request and auto-redirects
 * to /login when the token is missing, expired, or invalid (401).
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/** A typed wrapper around an Axios request for readable generic usage. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

// ─── API Groups ───────────────────────────────────────────────────────────────

export const authAPI = {
  login: (data: LoginPayload) => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data),
  getMe: () => api.get<{ user: User }>("/auth/me"),
  getCandidates: () =>
    api.get<{ candidates: User[] }>("/auth/candidates"),
  getCandidate: (id: string) =>
    api.get<{ candidate: User }>(`/auth/candidates/${id}`),
};

export const weeksAPI = {
  getAll: (projectId?: string) =>
    api.get<{ weeks: Week[] }>("/weeks/", {
      params: projectId ? { project_id: projectId } : {},
    }),
  getOne: (id: string) => api.get<{ week: Week }>(`/weeks/${id}`),
  create: (data: Partial<Week>) => api.post<{ week: Week }>("/weeks/", data),
  update: (id: string, data: Partial<Week>) =>
    api.put<{ week: Week }>(`/weeks/${id}`, data),
  delete: (id: string) => api.delete(`/weeks/${id}`),
};

export const projectsAPI = {
  getAll: (search?: string) =>
    api.get<{ projects: Project[] }>("/projects/", {
      params: search ? { search } : {},
    }),
  getDiscover: (search?: string) =>
    api.get<{ projects: Project[] }>("/projects/discover", {
      params: search ? { search } : {},
    }),
  getMyRequests: () =>
    api.get<{ requests: ProjectJoinRequest[] }>("/projects/my-requests"),
  getOne: (id: string) => api.get<{ project: Project }>(`/projects/${id}`),
  create: (data: { name: string; description?: string; public_joining?: boolean }) =>
    api.post<{ message: string; project: Project }>("/projects/", data),
  update: (id: string, data: Partial<Project>) =>
    api.put<{ message: string; project: Project }>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/projects/${id}`),
  regenerateCode: (id: string) =>
    api.post<{ message: string; invite_code: string }>(
      `/projects/${id}/regenerate-code`
    ),
  submitJoinRequest: (invite_code: string) =>
    api.post<{
      message: string;
      project_name?: string;
      project_id?: string;
      status?: string;
    }>("/projects/join-request", { invite_code }),
  joinPublic: (projectId: string) =>
    api.post<{
      message: string;
      project_name?: string;
      project_id?: string;
      status?: string;
    }>(`/projects/${projectId}/join`),
  cancelJoinRequest: (projectId: string) =>
    api.post<{ message: string; status?: string }>(
      `/projects/${projectId}/join-requests/cancel`
    ),
  acceptJoinRequest: (projectId: string, requestId: string) =>
    api.post<{ message: string; status?: string }>(
      `/projects/${projectId}/join-requests/${requestId}/accept`
    ),
  rejectJoinRequest: (
    projectId: string,
    requestId: string,
    feedback?: string
  ) =>
    api.post<{ message: string; status?: string }>(
      `/projects/${projectId}/join-requests/${requestId}/reject`,
      { feedback }
    ),
  addMember: (
    projectId: string,
    data: { email?: string; username?: string; role?: string }
  ) =>
    api.post<{ message: string; member: ProjectMember }>(
      `/projects/${projectId}/members`,
      data
    ),
  removeMember: (projectId: string, memberId: string) =>
    api.delete<{ message: string }>(
      `/projects/${projectId}/members/${memberId}`
    ),
  getWeeks: (projectId: string) =>
    api.get<{ weeks: Week[] }>(`/projects/${projectId}/weeks`),
};

export const notificationsAPI = {
  getAll: () =>
    api.get<{ notifications: NotificationItem[]; unread_count: number }>(
      "/notifications/"
    ),
  markAsRead: (id: string) =>
    api.post<{ message: string }>(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.post<{ message: string }>("/notifications/read-all"),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/notifications/${id}`),
};

export const submissionsAPI = {
  create: (formData: FormData) =>
    api.post<{ submission: Submission }>("/submissions/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: (projectId?: string) =>
    api.get<{ submissions: Submission[] }>("/submissions/", {
      params: projectId ? { project_id: projectId } : {},
    }),
  getOne: (id: string) =>
    api.get<{ submission: Submission }>(`/submissions/${id}`),
  update: (id: string, data: Partial<Submission> | FormData) => {
    if (data instanceof FormData) {
      return api.put<{ message: string; submission: Submission }>(
        `/submissions/${id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    }
    return api.put<{ message: string; submission: Submission }>(
      `/submissions/${id}`,
      data
    );
  },
  deleteScreenshot: (submissionId: string, fileId: string) =>
    api.delete<{ message: string }>(
      `/submissions/${submissionId}/screenshots/${fileId}`
    ),
  uploadScreenshots: (id: string, formData: FormData) =>
    api.post(`/submissions/${id}/screenshots`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getByWeek: (weekId: string) =>
    api.get<{ submissions: Submission[] }>(`/submissions/week/${weekId}`),
  getByCandidate: (candidateId: string, projectId?: string) =>
    api.get<{ submissions: Submission[] }>(
      `/submissions/candidate/${candidateId}`,
      { params: projectId ? { project_id: projectId } : {} }
    ),
};

export const reviewsAPI = {
  getAnnotations: (imageId: string) =>
    api.get<{ annotations: Annotation[] }>(`/reviews/annotations/${imageId}`),
  createAnnotation: (data: Record<string, unknown>) =>
    api.post<{ annotation: Annotation }>("/reviews/annotations", data),
  updateAnnotation: (id: string, data: Record<string, unknown>) =>
    api.put<{ annotation: Annotation }>(`/reviews/annotations/${id}`, data),
  deleteAnnotation: (id: string) => api.delete(`/reviews/annotations/${id}`),
  createIssue: (data: Partial<Issue>) =>
    api.post<{ issue: Issue }>("/reviews/issues", data),
  updateIssue: (id: string, data: Partial<Issue>) =>
    api.put<{ issue: Issue }>(`/reviews/issues/${id}`, data),
  deleteIssue: (id: string) => api.delete(`/reviews/issues/${id}`),
  getIssuesBySubmission: (submissionId: string) =>
    api.get<{ issues: Issue[] }>(`/reviews/issues/submission/${submissionId}`),
  getIssuesByCandidate: (candidateId: string) =>
    api.get<{ issues: Issue[] }>(`/reviews/issues/candidate/${candidateId}`),
  uploadReference: (formData: FormData) =>
    api.post<{ url: string }>("/reviews/reference-upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const gradesAPI = {
  createOrUpdate: (data: Record<string, unknown>) =>
    api.post<{ grade: Grade }>("/grades/", data),
  getBySubmission: (submissionId: string) =>
    api.get<{ grade: Grade }>(`/grades/submission/${submissionId}`),
  publish: (submissionId: string) =>
    api.post<{ grade: Grade }>(`/grades/publish/${submissionId}`),
  getCandidateGrades: (candidateId: string, projectId?: string) =>
    api.get<{ grades: Grade[] }>(`/grades/candidate/${candidateId}`, {
      params: projectId ? { project_id: projectId } : {},
    }),
  getAll: () => api.get<{ grades: Grade[] }>("/grades/all"),
  getCandidateStats: (candidateId: string, projectId?: string) =>
    api.get(`/grades/stats/candidate/${candidateId}`, {
      params: projectId ? { project_id: projectId } : {},
    }),
  getOverviewStats: () => api.get("/grades/stats/overview"),
};

export const linkedinAPI = {
  candidateGetSubmissions: () =>
    api.get<{ submissions: PostSubmission[] }>("/linkedin/candidate/submissions"),
  getSubmission: (id: string) =>
    api.get<{ submission: PostSubmission }>(`/linkedin/submissions/${id}`),
  uploadMedia: (formData: FormData) =>
    api.post<{ urls: string[]; message: string }>("/linkedin/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  saveDraft: (data: Partial<PostSubmission> & { media_urls?: string[] }) =>
    api.post<{ submission: PostSubmission; message: string }>(
      "/linkedin/draft",
      data
    ),
  submitForApproval: (
    data: Partial<PostSubmission> & { media_urls?: string[] }
  ) =>
    api.post<{ submission: PostSubmission; message: string }>(
      "/linkedin/submit",
      data
    ),
  resubmit: (
    id: string,
    data: Partial<PostSubmission> & { media_urls?: string[] }
  ) =>
    api.post<{ submission: PostSubmission; message: string }>(
      `/linkedin/resubmit/${id}`,
      data
    ),
  adminGetSubmissions: (statusFilter?: string) =>
    api.get<{ submissions: PostSubmission[] }>("/linkedin/admin/submissions", {
      params: statusFilter ? { status: statusFilter } : {},
    }),
  adminReviewSubmission: (
    id: string,
    payload: { decision: "Approved" | "Needs Changes"; feedback?: string }
  ) =>
    api.post<{ submission: PostSubmission; message: string }>(
      `/linkedin/admin/submissions/${id}/review`,
      payload
    ),
  adminMarkViewed: (id: string) =>
    api.post(`/linkedin/admin/submissions/${id}/view`),
};

export default api;