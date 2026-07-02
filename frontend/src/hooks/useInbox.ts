import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "../api/notifications";
import type { NotificationItem } from "../types/notification";

export function useInbox(pollMs = 60000) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await notificationApi.getInbox();
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch {
      // 무음 실패: 헤더 종은 조용히 비워둔다
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    if (!pollMs) return;
    const id = setInterval(refetch, pollMs);
    return () => clearInterval(id);
  }, [refetch, pollMs]);

  const markRead = useCallback(async (id: string) => {
    // 낙관적 업데이트
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_read: true } : it)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      refetch();
    }
  }, [refetch]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      refetch();
    }
  }, [refetch]);

  const dismiss = useCallback(async (id: string) => {
    const target = items.find((it) => it.id === id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (target && !target.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.dismiss(id);
    } catch {
      refetch();
    }
  }, [items, refetch]);

  return { items, unreadCount, loading, refetch, markRead, markAllRead, dismiss };
}
