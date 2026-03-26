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
  notes?: string;
}

export type SubscriptionUpdateRequest = Partial<SubscriptionCreateRequest>;
