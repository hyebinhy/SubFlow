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

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  category: string | null;
  link: string | null;
  image_url: string | null;
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  created_at: string;
}

export interface InboxResponse {
  items: NotificationItem[];
  unread_count: number;
}
