import { z } from "zod";

/**
 * Maps Laravel 422 Unprocessable Entity validation errors ({ message, errors: { field: ["..."] } })
 * directly onto react-hook-form's setError(field, { type: "server", message })
 * and returns a top-level summary string.
 */
export function applyLaravelValidationErrors(error, setError) {
  const rawErrors = error?.errors || error?.payload?.errors || error?.response?.data?.errors || {};
  let firstMessage = error?.message || "Please correct the highlighted form errors.";

  if (rawErrors && typeof rawErrors === "object") {
    Object.entries(rawErrors).forEach(([field, messages]) => {
      const msg = Array.isArray(messages) ? messages[0] : String(messages);
      if (msg && firstMessage === "Please correct the highlighted form errors.") {
        firstMessage = msg;
      }
      if (typeof setError === "function") {
        setError(field, { type: "server", message: msg });
      }
    });
  }

  return firstMessage;
}

/**
 * Extracts a flat { [field]: "Error message" } dictionary from any API/Laravel 422 error.
 */
export function extractFieldErrors(error) {
  if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
    return error.fieldErrors;
  }
  const raw = error?.errors || error?.payload?.errors || {};
  const map = {};
  Object.entries(raw).forEach(([k, v]) => {
    map[k] = Array.isArray(v) ? v[0] : String(v);
  });
  return map;
}

/**
 * Zod Schemas for Role Dashboards & Core Forms
 */
export const schoolOnboardingSchema = z.object({
  name: z.string().min(3, "School name must be at least 3 characters"),
  short_name: z.string().min(2, "Short code is required (e.g., GWA)").max(20),
  slug: z
    .string()
    .min(2, "Subdomain slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Enter a valid official school email address"),
  phone: z.string().min(7, "Enter a valid contact phone number"),
  city: z.string().min(2, "City is required"),
  plan: z.enum(["free_trial", "standard", "premium"]).default("standard"),
  primary_color: z.string().default("#0f172a"),
});

export const lessonNoteSchema = z.object({
  class_id: z.string().min(1, "Please select a class"),
  subject_name: z.string().min(2, "Subject name is required"),
  topic: z.string().min(3, "Lesson topic must be at least 3 characters"),
  objectives: z.string().min(5, "Enter key learning objectives for this lesson"),
  week_number: z.string().min(1, "Week is required"),
});

export const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
