import { useCallback, useEffect, useState } from "react";
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
import { analyticsApi } from "../api/analytics";

export function useAnalytics() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] =
    useState<CategoryBreakdown | null>(null);
  const [spendingTrend, setSpendingTrend] = useState<SpendingTrend | null>(
    null
  );
  const [overlaps, setOverlaps] = useState<OverlapDetectionResponse | null>(null);
  const [exchangeRateAlerts, setExchangeRateAlerts] =
    useState<ExchangeRateAlertResponse | null>(null);
  const [trials, setTrials] = useState<TrialTrackingResponse | null>(null);
  const [savingsSuggestions, setSavingsSuggestions] =
    useState<SavingsSuggestionsResponse | null>(null);
  const [priceChanges, setPriceChanges] =
    useState<PriceChangeAlertResponse | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, cb, st] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getCategoryBreakdown(),
        analyticsApi.getSpendingTrend(6),
      ]);
      setOverview(ov);
      setCategoryBreakdown(cb);
      setSpendingTrend(st);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }

    // Fetch smart features separately so they don't block initial render
    const results = await Promise.allSettled([
      analyticsApi.getOverlaps(),
      analyticsApi.getExchangeRateAlerts(),
      analyticsApi.getTrials(),
      analyticsApi.getSavingsSuggestions(),
      analyticsApi.getPriceChanges(),
      analyticsApi.getBudgetStatus(),
    ]);

    if (results[0].status === "fulfilled") setOverlaps(results[0].value);
    if (results[1].status === "fulfilled") setExchangeRateAlerts(results[1].value);
    if (results[2].status === "fulfilled") setTrials(results[2].value);
    if (results[3].status === "fulfilled") setSavingsSuggestions(results[3].value);
    if (results[4].status === "fulfilled") setPriceChanges(results[4].value);
    if (results[5].status === "fulfilled") setBudgetStatus(results[5].value);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    overview,
    categoryBreakdown,
    spendingTrend,
    overlaps,
    exchangeRateAlerts,
    trials,
    savingsSuggestions,
    priceChanges,
    budgetStatus,
    loading,
    error,
    refetch: fetchAll,
  };
}
