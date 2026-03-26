export interface NotificationSettings {
  id: string;
  user_id: string;
  notify_days_before: number;
  email_notifications: boolean;
  push_notifications: boolean;
  budget_monthly: number | null;
}

export interface NotificationSettingsUpdate {
  notify_days_before?: number;
  email_notifications?: boolean;
  push_notifications?: boolean;
  budget_monthly?: number | null;
}
