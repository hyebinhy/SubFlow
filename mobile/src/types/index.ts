export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Subscription {
  id: string;
  service_name: string;
  plan_name: string | null;
  billing_amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'weekly';
  next_billing_date: string;
  status: 'active' | 'paused' | 'cancelled' | 'trial';
  category_name: string;
  service_logo_url: string | null;
  color: string | null;
  started_at: string;
  is_custom: boolean;
}

export interface AnalyticsOverview {
  total_monthly: number;
  total_yearly: number;
  active_count: number;
  next_payment: {
    service_name: string;
    amount: number;
    date: string;
  } | null;
  currency: string;
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface SpendingTrend {
  month: string;
  amount: number;
}

export interface NotificationSettings {
  days_before_payment: number;
  email_enabled: boolean;
  push_enabled: boolean;
  monthly_budget: number | null;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}
