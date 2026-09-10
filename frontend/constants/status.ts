/**
 * Project submission status values.
 */
export const SUBMISSION_STATUS = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_CHANGES: "Needs Changes",
} as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

/**
 * LinkedIn post submission status values.
 */
export const POST_STATUS = {
  DRAFT: "Draft",
  PENDING: "Pending Review",
  APPROVED: "Approved",
  NEEDS_CHANGES: "Needs Changes",
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

/**
 * Issue / annotation status values.
 */
export const ISSUE_STATUS = {
  TODO: "To Do",
  FIXED: "Fixed",
} as const;

export type IssueStatus = (typeof ISSUE_STATUS)[keyof typeof ISSUE_STATUS];

/**
 * Issue priority values.
 */
export const ISSUE_PRIORITY = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

export type IssuePriority =
  (typeof ISSUE_PRIORITY)[keyof typeof ISSUE_PRIORITY];

/**
 * Join request status values.
 */
export const JOIN_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type JoinStatus = (typeof JOIN_STATUS)[keyof typeof JOIN_STATUS];
