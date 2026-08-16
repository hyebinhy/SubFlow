import type {
  BudgetStatus,
  CategoryBreakdown,
  DashboardOverview,
  ExchangeRateAlertResponse,
  OverlapDetectionResponse,
  PriceChangeAlertResponse,
  SavingsSuggestionsResponse,
  SpendingTrend,
  TrialTrackingResponse,
} from "../types/analytics";
import apiClient from "./client";

export interface ExchangeRatesResponse {
  base: string;
  rates: Record<string, number>;
  /** 환율 기준일(YYYY-MM-DD). ECB 고시라 영업일 1회만 갱신된다. */
  as_of: string | null;
}

export const analyticsApi = {
  getExchangeRates: () =>
    apiClient
      .get<ExchangeRatesResponse>("/analytics/exchange-rates")
      .then((r) => r.data),

  getOverview: () =>
    apiClient.get<DashboardOverview>("/analytics/overview").then((r) => r.data),

  getCategoryBreakdown: (year?: number, month?: number) =>
    apiClient
      .get<CategoryBreakdown>("/analytics/category-breakdown", {
        params: { year, month },
      })
      .then((r) => r.data),

  getSpendingTrend: (months = 6) =>
    apiClient
      .get<SpendingTrend>("/analytics/spending-trend", {
        params: { months },
      })
      .then((r) => r.data),

  getOverlaps: () =>
    apiClient
      .get<OverlapDetectionResponse>("/analytics/overlaps")
      .then((r) => r.data),

  getExchangeRateAlerts: () =>
    apiClient
      .get<ExchangeRateAlertResponse>("/analytics/exchange-rate-alerts")
      .then((r) => r.data),

  getTrials: () =>
    apiClient
      .get<TrialTrackingResponse>("/analytics/trials")
      .then((r) => r.data),

  getSavingsSuggestions: () =>
    apiClient
      .get<SavingsSuggestionsResponse>("/analytics/savings-suggestions")
      .then((r) => r.data),

  getPriceChanges: () =>
    apiClient
      .get<PriceChangeAlertResponse>("/analytics/price-changes")
      .then((r) => r.data),

  getBudgetStatus: () =>
    apiClient
      .get<BudgetStatus>("/analytics/budget-status")
      .then((r) => r.data),
};
