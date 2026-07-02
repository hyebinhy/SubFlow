import type {
  InboxResponse,
  NotificationSettings,
  NotificationSettingsUpdate,
} from "../types/notification";
import type { Subscription } from "../types/subscription";
import apiClient from "./client";

export const notificationApi = {
  getSettings: () =>
    apiClient
      .get<NotificationSettings>("/notifications/settings")
      .then((r) => r.data),

  updateSettings: (data: NotificationSettingsUpdate) =>
    apiClient
      .put<NotificationSettings>("/notifications/settings", data)
      .then((r) => r.data),

  getUpcoming: () =>
    apiClient
      .get<Subscription[]>("/notifications/upcoming")
      .then((r) => r.data),

  // ── 인박스 ──
  getInbox: () =>
    apiClient.get<InboxResponse>("/notifications/inbox").then((r) => r.data),

  markRead: (id: string) =>
    apiClient.post(`/notifications/inbox/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    apiClient.post("/notifications/inbox/read-all").then((r) => r.data),

  dismiss: (id: string) =>
    apiClient.delete(`/notifications/inbox/${id}`).then((r) => r.data),
};
