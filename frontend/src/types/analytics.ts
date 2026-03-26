export interface DashboardOverview {
  total_active_subscriptions: number;
  total_monthly_cost: number;
  total_yearly_cost: number;
  currency: string;
  next_renewal: {
    service_name: string;
    next_billing_date: string;
    cost: number;
  } | null;
  most_expensive: {
    service_name: string;
    monthly_cost: number;
  } | null;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface CategoryBreakdown {
  year: number;
  month: number;
  breakdown: CategoryBreakdownItem[];
  total: number;
}

export interface MonthlyTotal {
  year: number;
  month: number;
  total: number;
}

export interface SpendingTrend {
  data: MonthlyTotal[];
}
