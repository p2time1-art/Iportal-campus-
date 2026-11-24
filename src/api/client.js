const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
let csrfToken = null;

/**
 * Ensures all domain endpoints route through /api/v1/... (while keeping /auth/* at /api/auth/*)
 */
export function normalizeApiV1Path(path) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean.startsWith("/v1/") || clean.startsWith("/auth/")) {
    return clean;
  }
  return `/v1${clean}`;
}

export class ApiError extends Error {
  /** @param {string} message @param {{status?: number, errors?: Record<string, string[]>, payload?: unknown}} [options] */
  constructor(message, { status, errors = {}, payload = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors || {};
    this.payload = payload;
    this.fieldErrors = Object.fromEntries(
      Object.entries(this.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])
    );
  }
}

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    let message =
      response.status >= 500
        ? "The server could not complete the request. Please try again."
        : payload?.message || payload?.error || "The request could not be completed.";

    if (response.status === 422 && payload?.errors) {
      const firstErr = Object.values(payload.errors).flat()[0];
      if (firstErr) {
        message = firstErr;
      }
    }

    throw new ApiError(message, {
      status: response.status,
      errors: payload?.errors || {},
      payload,
    });
  }

  return payload;
}

/** @param {string} path @param {RequestInit} [options] */
async function fetchJson(path, options = {}) {
  const routedPath = normalizeApiV1Path(path);
  const tenantHeaders = {};
  try {
    const slug = window.localStorage?.getItem("iportal_active_school_slug");
    if (slug) tenantHeaders["X-School-Slug"] = slug;
  } catch (_e) {}

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${routedPath}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...tenantHeaders,
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  try {
    return await readResponse(response);
  } catch (error) {
    if (error.status === 401 && !routedPath.startsWith("/auth/")) {
      window.dispatchEvent(new CustomEvent("iportal:unauthorized"));
    }
    throw error;
  }
}

export async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await fetchJson("/auth/csrf");
  csrfToken = response.csrf_token;
  return csrfToken;
}

/**
 * @param {string} path
 * @param {{method?: string, body?: unknown, headers?: HeadersInit}} [options]
 */
export async function apiRequest(path, { method = "GET", body, headers } = {}) {
  const normalizedMethod = method.toUpperCase();
  const requestHeaders = { ...headers };

  if (!["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)) {
    requestHeaders["X-CSRF-TOKEN"] = await ensureCsrfToken();
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const options = {
    method: normalizedMethod,
    headers: requestHeaders,
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  };

  try {
    return await fetchJson(path, options);
  } catch (error) {
    if (error.status !== 419 || ["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)) {
      throw error;
    }

    csrfToken = null;
    requestHeaders["X-CSRF-TOKEN"] = await ensureCsrfToken();
    return fetchJson(path, options);
  }
}
