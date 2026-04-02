import { useState, useEffect, useCallback } from 'react';
import { subscriptionAPI, analyticsAPI, servicesAPI, notificationAPI } from '../services/api';

function useFetch<T>(fetcher: () => Promise<{ data: T }>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ── Subscriptions ──
export function useSubscriptions() {
  return useFetch(() => subscriptionAPI.getAll());
}

export function useUpcomingSubscriptions() {
  return useFetch(() => subscriptionAPI.getUpcoming());
}

export function useCalendarEvents(year: number, month: number) {
  return useFetch(() => subscriptionAPI.getCalendarEvents(year, month), [year, month]);
}

export function useTimeline() {
  return useFetch(() => subscriptionAPI.getTimeline());
}

// ── Analytics ──
export function useAnalyticsOverview() {
  return useFetch(() => analyticsAPI.getOverview());
}

export function useCategoryBreakdown() {
  return useFetch(() => analyticsAPI.getCategoryBreakdown());
}

export function useSpendingTrend() {
  return useFetch(() => analyticsAPI.getSpendingTrend());
}

export function useSavingsSuggestions() {
  return useFetch(() => analyticsAPI.getSavingsSuggestions());
}

export function useBudgetStatus() {
  return useFetch(() => analyticsAPI.getBudgetStatus());
}

export function usePriceChanges() {
  return useFetch(() => analyticsAPI.getPriceChanges());
}

export function useOverlaps() {
  return useFetch(() => analyticsAPI.getOverlaps());
}

// ── Services ──
export function useServices() {
  return useFetch(() => servicesAPI.getAll());
}

// ── Notifications ──
export function useNotificationSettings() {
  return useFetch(() => notificationAPI.getSettings());
}
