import type {
  CategoryBreakdown,
  DashboardOverview,
  ExchangeRateAlertResponse,
  OverlapDetectionResponse,
  SavingsSuggestionsResponse,
  SpendingTrend,
  TrialTrackingResponse,
} from "../types/analytics";
import apiClient from "./client";

export const analyticsApi = {
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
};
