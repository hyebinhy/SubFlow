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

  /** 재설정 메일 요청. 가입되지 않은 주소여도 성공으로 답한다(사용자 열거 방지). */
  forgotPassword: (email: string) =>
    apiClient
      .post<{ message: string }>("/auth/forgot-password", { email })
      .then((r) => r.data),

  verifyEmail: (token: string) =>
    apiClient
      .post<{ message: string }>("/auth/verify-email", { token })
      .then((r) => r.data),

  resendVerification: () =>
    apiClient
      .post<{ message: string }>("/auth/verify-email/resend")
      .then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    apiClient
      .post<{ message: string }>("/auth/reset-password", {
        token,
        new_password: newPassword,
      })
      .then((r) => r.data),
};
