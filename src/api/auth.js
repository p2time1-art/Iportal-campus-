import { apiRequest, ensureCsrfToken } from "./client";

export const authApi = {
  /** @param {{pin: string, password: string}} credentials */
  async login(credentials) {
    await ensureCsrfToken();
    return apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    });
  },

  me() {
    return apiRequest("/auth/me");
  },

  logout() {
    return apiRequest("/auth/logout", { method: "POST" });
  },

  /** @param {{current_password: string, password: string, password_confirmation: string}} passwords */
  changePassword(passwords) {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: passwords,
    });
  },
};
