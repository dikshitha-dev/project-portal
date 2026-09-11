/**
 * Supabase Data Access Layer Compatibility Wrapper for Project Review Portal.
 * Wraps service modules with Axios-compatible `{ data }` response structures.
 */
import { authService } from "./services/auth";
import { weeksService } from "./services/weeks";
import { projectsService } from "./services/projects";
import { submissionsService } from "./services/submissions";
import { reviewsService } from "./services/reviews";
import { gradesService } from "./services/grades";
import { notificationsService } from "./services/notifications";
import { linkedinService } from "./services/linkedin";
import { profilesService } from "./services/profiles";

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

// ─── API Compatibility Layer (Axios Data-Wrapped) ──────────────────────────────

export const authAPI = {
  login: async (data: Parameters<typeof authService.login>[0]) => ({
    data: await authService.login(data),
  }),
  register: async (data: Parameters<typeof authService.register>[0]) => ({
    data: await authService.register(data),
  }),
  getMe: async () => ({
    data: await authService.getMe(),
  }),
  getCandidates: async () => ({
    data: await authService.getCandidates(),
  }),
  getCandidate: async (id: string) => ({
    data: await authService.getCandidate(id),
  }),
};

export const weeksAPI = {
  getAll: async (projectId?: string) => ({
    data: await weeksService.getAll(projectId),
  }),
  getOne: async (id: string) => ({
    data: await weeksService.getOne(id),
  }),
  create: async (data: Parameters<typeof weeksService.create>[0]) => ({
    data: await weeksService.create(data),
  }),
  update: async (id: string, data: Parameters<typeof weeksService.update>[1]) => ({
    data: await weeksService.update(id, data),
  }),
  delete: async (id: string) => ({
    data: await weeksService.delete(id),
  }),
};

export const projectsAPI = {
  getAll: async (search?: string) => ({
    data: await projectsService.getAll(search),
  }),
  getDiscover: async (search?: string) => ({
    data: await projectsService.getDiscover(search),
  }),
  getMyRequests: async () => ({
    data: await projectsService.getMyRequests(),
  }),
  getOne: async (id: string) => ({
    data: await projectsService.getOne(id),
  }),
  create: async (data: Parameters<typeof projectsService.create>[0]) => ({
    data: await projectsService.create(data),
  }),
  update: async (id: string, data: Parameters<typeof projectsService.update>[1]) => ({
    data: await projectsService.update(id, data),
  }),
  delete: async (id: string) => ({
    data: await projectsService.delete(id),
  }),
  submitJoinRequest: async (inviteCode: string) => ({
    data: await projectsService.submitJoinRequest(inviteCode),
  }),
  joinPublic: async (projectId: string) => ({
    data: await projectsService.joinPublic(projectId),
  }),
  cancelJoinRequest: async (projectId: string) => ({
    data: await projectsService.cancelJoinRequest(projectId),
  }),
  acceptJoinRequest: async (projectId: string, requestId: string) => ({
    data: await projectsService.acceptJoinRequest(projectId, requestId),
  }),
  rejectJoinRequest: async (projectId: string, requestId: string, feedback?: string) => ({
    data: await projectsService.rejectJoinRequest(projectId, requestId, feedback),
  }),
  getWeeks: async (projectId: string) => ({
    data: await projectsService.getWeeks(projectId),
  }),
  regenerateCode: async (id: string) => ({
    data: await projectsService.regenerateCode(id),
  }),
  addMember: async (projectId: string, data: Parameters<typeof projectsService.addMember>[1]) => ({
    data: await projectsService.addMember(projectId, data),
  }),
  removeMember: async (projectId: string, memberId: string) => ({
    data: await projectsService.removeMember(projectId, memberId),
  }),
};

export const notificationsAPI = {
  getAll: async () => ({
    data: await notificationsService.getAll(),
  }),
  markAsRead: async (id: string) => ({
    data: await notificationsService.markAsRead(id),
  }),
  markAllAsRead: async () => ({
    data: await notificationsService.markAllAsRead(),
  }),
  delete: async (id: string) => ({
    data: await notificationsService.delete(id),
  }),
};

export const submissionsAPI = {
  create: async (formData: FormData) => ({
    data: await submissionsService.create(formData),
  }),
  getAll: async (projectId?: string) => ({
    data: await submissionsService.getAll(projectId),
  }),
  getOne: async (id: string) => ({
    data: await submissionsService.getOne(id),
  }),
  update: async (id: string, data: Parameters<typeof submissionsService.update>[1]) => ({
    data: await submissionsService.update(id, data),
  }),
  deleteScreenshot: async (submissionId: string, fileId: string) => ({
    data: await submissionsService.deleteScreenshot(submissionId, fileId),
  }),
  uploadScreenshots: async (id: string, formData: FormData) => ({
    data: await submissionsService.uploadScreenshots(id, formData),
  }),
  getByWeek: async (weekId: string) => ({
    data: await submissionsService.getByWeek(weekId),
  }),
  getByCandidate: async (candidateId: string, projectId?: string) => ({
    data: await submissionsService.getByCandidate(candidateId, projectId),
  }),
};

export const reviewsAPI = {
  getAnnotations: async (imageId: string) => ({
    data: await reviewsService.getAnnotations(imageId),
  }),
  createAnnotation: async (data: Record<string, unknown>) => ({
    data: await reviewsService.createAnnotation(data),
  }),
  updateAnnotation: async (id: string, data: Record<string, unknown>) => ({
    data: await reviewsService.updateAnnotation(id, data),
  }),
  deleteAnnotation: async (id: string) => ({
    data: await reviewsService.deleteAnnotation(id),
  }),
  createIssue: async (data: Parameters<typeof reviewsService.createIssue>[0]) => ({
    data: await reviewsService.createIssue(data),
  }),
  updateIssue: async (id: string, data: Parameters<typeof reviewsService.updateIssue>[1]) => ({
    data: await reviewsService.updateIssue(id, data),
  }),
  deleteIssue: async (id: string) => ({
    data: await reviewsService.deleteIssue(id),
  }),
  getIssuesBySubmission: async (submissionId: string) => ({
    data: await reviewsService.getIssuesBySubmission(submissionId),
  }),
  getIssuesByCandidate: async (candidateId: string) => ({
    data: await reviewsService.getIssuesByCandidate(candidateId),
  }),
};

export const gradesAPI = {
  createOrUpdate: async (data: Record<string, unknown>) => ({
    data: await gradesService.createOrUpdate(data),
  }),
  getBySubmission: async (submissionId: string) => ({
    data: await gradesService.getBySubmission(submissionId),
  }),
  publish: async (submissionId: string) => ({
    data: await gradesService.publish(submissionId),
  }),
  getCandidateGrades: async (candidateId: string, projectId?: string) => ({
    data: await gradesService.getCandidateGrades(candidateId, projectId),
  }),
  getAll: async () => ({
    data: await gradesService.getAll(),
  }),
  getCandidateStats: async (candidateId: string, projectId?: string) => ({
    data: await gradesService.getCandidateStats(candidateId, projectId),
  }),
  getOverviewStats: async () => ({
    data: await gradesService.getOverviewStats(),
  }),
};

export const linkedinAPI = {
  candidateGetSubmissions: async () => ({
    data: await linkedinService.candidateGetSubmissions(),
  }),
  getSubmission: async (id: string) => ({
    data: await linkedinService.getSubmission(id),
  }),
  uploadMedia: async (formData: FormData) => ({
    data: await linkedinService.uploadMedia(formData),
  }),
  saveDraft: async (data: Parameters<typeof linkedinService.saveDraft>[0]) => ({
    data: await linkedinService.saveDraft(data),
  }),
  submitForApproval: async (data: Parameters<typeof linkedinService.submitForApproval>[0]) => ({
    data: await linkedinService.submitForApproval(data),
  }),
  resubmit: async (id: string, data: Parameters<typeof linkedinService.resubmit>[1]) => ({
    data: await linkedinService.resubmit(id, data),
  }),
  adminGetSubmissions: async (statusFilter?: string) => ({
    data: await linkedinService.adminGetSubmissions(statusFilter),
  }),
  adminReviewSubmission: async (id: string, payload: Parameters<typeof linkedinService.adminReviewSubmission>[1]) => ({
    data: await linkedinService.adminReviewSubmission(id, payload),
  }),
  adminMarkViewed: async (id: string) => ({
    data: await linkedinService.adminMarkViewed(id),
  }),
};

export { profilesService };