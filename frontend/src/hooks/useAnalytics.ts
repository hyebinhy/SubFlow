import { useCallback, useEffect, useState } from "react";
import type {
  CategoryBreakdown,
  DashboardOverview,
  SpendingTrend,
} from "../types/analytics";
import { analyticsApi } from "../api/analytics";

export function useAnalytics() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] =
    useState<CategoryBreakdown | null>(null);
  const [spendingTrend, setSpendingTrend] = useState<SpendingTrend | null>(
    null
  );
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
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { overview, categoryBreakdown, spendingTrend, loading, error, refetch: fetchAll };
}
