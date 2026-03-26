import { useCallback, useEffect, useState } from "react";
import type { Subscription } from "../types/subscription";
import type { Category } from "../types/category";
import { subscriptionApi } from "../api/subscriptions";
import { categoryApi } from "../api/categories";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, cats] = await Promise.all([
        subscriptionApi.getAll({ sort_by: "next_billing_date", order: "asc" }),
        categoryApi.getAll(),
      ]);
      setSubscriptions(subs);
      setCategories(cats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { subscriptions, categories, loading, error, refetch: fetchAll };
}
