/**
 * Form validation utilities — reusable across SubmissionForm, LoginForm, etc.
 */

import { isValidHttpUrl } from "./url";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a required field is non-empty.
 */
export function validateRequired(
  value: string,
  label = "This field"
): ValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, error: `${label} is required.` };
  }
  return { valid: true };
}

/**
 * Validate a GitHub repository URL.
 * Must be a valid http/https URL.
 */
export function validateGitHubUrl(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, error: "GitHub repository URL is required." };
  }
  if (!isValidHttpUrl(value.trim())) {
    return {
      valid: false,
      error:
        "Please enter a valid URL (e.g. https://github.com/username/project).",
    };
  }
  return { valid: true };
}

/**
 * Validate a deployed project URL.
 * Must be a valid http/https URL.
 */
export function validateDeployedUrl(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, error: "Deployed project URL is required." };
  }
  if (!isValidHttpUrl(value.trim())) {
    return {
      valid: false,
      error:
        "Please enter a valid URL (e.g. https://your-project.vercel.app).",
    };
  }
  return { valid: true };
}

/**
 * Validate an optional URL — only fails if present but invalid.
 */
export function validateOptionalUrl(value: string): ValidationResult {
  if (!value || !value.trim()) return { valid: true };
  if (!isValidHttpUrl(value.trim())) {
    return {
      valid: false,
      error: "Please enter a valid URL (https://...).",
    };
  }
  return { valid: true };
}

/**
 * Validate an email address.
 */
export function validateEmail(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, error: "Email is required." };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value.trim())) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true };
}

/**
 * Validate a password (minimum length).
 */
export function validatePassword(
  value: string,
  minLength = 6
): ValidationResult {
  if (!value) {
    return { valid: false, error: "Password is required." };
  }
  if (value.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters.`,
    };
  }
  return { valid: true };
}
