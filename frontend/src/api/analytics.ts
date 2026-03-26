import type {
  CategoryBreakdown,
  DashboardOverview,
  SpendingTrend,
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
};
