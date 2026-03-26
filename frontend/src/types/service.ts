import type { Category } from "./category";
import type { BillingCycle } from "./subscription";

export interface ServicePlan {
  id: number;
  service_id: number;
  name: string;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  description?: string;
  is_active: boolean;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  category?: Category;
  logo_url?: string;
  website_url?: string;
  is_popular: boolean;
  created_at: string;
  plans: ServicePlan[];
}

export interface ServiceListItem {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  category?: Category;
  logo_url?: string;
  is_popular: boolean;
  plan_count: number;
  min_price?: number;
  currency?: string;
}
