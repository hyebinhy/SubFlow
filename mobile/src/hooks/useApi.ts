import { useState, useEffect, useCallback } from 'react';
import { subscriptionAPI, analyticsAPI, servicesAPI, notificationAPI } from '../services/api';

// 공통 fetch 훅
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

// ── 구독 목록 ──
export function useSubscriptions() {
  return useFetch(() => subscriptionAPI.getAll());
}

// ── 분석 개요 ──
export function useAnalyticsOverview() {
  return useFetch(() => analyticsAPI.getOverview());
}

// ── 카테고리별 지출 ──
export function useSpendingByCategory() {
  return useFetch(() => analyticsAPI.getSpendingByCategory());
}

// ── 월별 추이 ──
export function useSpendingTrend() {
  return useFetch(() => analyticsAPI.getSpendingTrend());
}

// ── 서비스 카탈로그 ──
export function useServices() {
  return useFetch(() => servicesAPI.getAll());
}

// ── 알림 설정 ──
export function useNotificationSettings() {
  return useFetch(() => notificationAPI.getSettings());
}
