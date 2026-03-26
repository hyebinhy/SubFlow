import type { LoginRequest, RegisterRequest, TokenPair, User } from "../types/auth";
import apiClient from "./client";

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<User>("/auth/register", data).then((r) => r.data),

  login: (data: LoginRequest) =>
    apiClient.post<TokenPair>("/auth/login", data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<TokenPair>("/auth/refresh", { refresh_token: refreshToken })
      .then((r) => r.data),

  getMe: () => apiClient.get<User>("/auth/me").then((r) => r.data),

  updateMe: (data: Partial<User>) =>
    apiClient.put<User>("/auth/me", data).then((r) => r.data),
};
