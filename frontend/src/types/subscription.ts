import type { Category } from "./category";
import type { Service, ServicePlan } from "./service";

export type BillingCycle = "monthly" | "yearly" | "weekly" | "quarterly";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "trial";

export interface Subscription {
  id: string;
  service_name: string;
  description?: string;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  billing_day?: number;
  start_date: string;
  next_billing_date: string;
  status: SubscriptionStatus;
  auto_renew: boolean;
  is_recurring: boolean;
  cancel_reminder: boolean;
  category_id?: number;
  category?: Category;
  service_id?: number;
  plan_id?: number;
  service?: Service;
  plan?: ServicePlan;
  logo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionCreateRequest {
  service_name: string;
  cost: number;
  currency?: string;
  billing_cycle: BillingCycle;
  billing_day?: number;
  start_date: string;
  next_billing_date: string;
  category_id?: number;
  status?: SubscriptionStatus;
  auto_renew?: boolean;
  is_recurring?: boolean;
  cancel_reminder?: boolean;
  notes?: string;
}

export type SubscriptionUpdateRequest = Partial<SubscriptionCreateRequest>;

export interface SubscriptionHistoryItem {
  id: string;
  subscription_id: string;
  event_type: "created" | "plan_changed" | "status_changed" | "price_changed" | "renewed";
  description: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface CalendarEvent {
  subscription_id: string;
  service_name: string;
  logo_url?: string;
  cost: number;
  currency: string;
  category_name?: string;
  category_color?: string;
  date: string;
  is_past: boolean;
  is_recurring: boolean;
}
