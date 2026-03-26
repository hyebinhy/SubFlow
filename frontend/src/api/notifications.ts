import type {
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
};
