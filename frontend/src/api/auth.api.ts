import { apiClient } from "./client";
import type { AuthLoginResponse, User } from "../types";

export const authApi = {
  login: async (login: string, password: string): Promise<AuthLoginResponse> => {
    return apiClient<AuthLoginResponse>("/auth/login", {
      method: "POST",
      body: { login, password },
    });
  },

  getProfile: async (): Promise<User> => {
    return apiClient<User>("/auth/profile", {
      method: "GET",
    });
  },
};
