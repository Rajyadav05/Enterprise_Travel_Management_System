import { apiClient } from "./client";
import type { AuthLoginResponse, User } from "../types";

export const authApi = {
  login: async (login: string, password: string): Promise<AuthLoginResponse> => {
    return apiClient<AuthLoginResponse>("/auth/login", {
      method: "POST",
      body: { login, password },
    });
  },

  refresh: async (): Promise<{ token: string; refreshToken?: string }> => {
    return apiClient<{ token: string; refreshToken?: string }>("/auth/refresh", {
      method: "POST",
    });
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient<void>("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Graceful local cleanup even if network fails
    }
  },

  getProfile: async (): Promise<User> => {
    return apiClient<User>("/auth/profile", {
      method: "GET",
    });
  },
};

