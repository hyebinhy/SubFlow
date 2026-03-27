import { useEffect, useState } from "react";
import {
  PlusCircle,
  ArrowRightLeft,
  RefreshCw,
  DollarSign,
  RotateCw,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { subscriptionApi } from "../api/subscriptions";
import type { SubscriptionHistoryItem } from "../types/subscription";

function getEventIcon(event: SubscriptionHistoryItem): {
  icon: LucideIcon;
  color: string;
  bg: string;
} {
  switch (event.event_type) {
    case "created":
      return { icon: PlusCircle, color: "text-green-600", bg: "bg-green-100" };
    case "plan_changed":
      return { icon: ArrowRightLeft, color: "text-blue-600", bg: "bg-blue-100" };
    case "status_changed": {
      const newVal = event.new_value?.toLowerCase();
      if (newVal === "paused")
        return { icon: RefreshCw, color: "text-amber-600", bg: "bg-amber-100" };
      if (newVal === "cancelled")
        return { icon: RefreshCw, color: "text-red-600", bg: "bg-red-100" };
      return { icon: RefreshCw, color: "text-green-600", bg: "bg-green-100" };
    }
    case "price_changed":
      return { icon: DollarSign, color: "text-purple-600", bg: "bg-purple-100" };
    case "renewed":
      return { icon: RotateCw, color: "text-indigo-600", bg: "bg-indigo-100" };
    default:
      return { icon: Clock, color: "text-slate-600", bg: "bg-slate-100" };
  }
}

function RelativeTime({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr);
  const relative = formatDistanceToNow(date, { addSuffix: true, locale: ko });
  const absolute = format(date, "yyyy.MM.dd HH:mm", { locale: ko });

  return (
    <div className="text-right shrink-0">
      <p className="text-xs font-medium text-slate-500">{relative}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{absolute}</p>
    </div>
  );
}

export default function TimelinePage() {
  const [events, setEvents] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subscriptionApi
      .getTimeline()
      .then((data) => setEvents(data.events))
      .catch(() => setError("히스토리를 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">구독 히스토리</h2>
        <p className="mt-1 text-sm text-slate-400">
          구독 변경 이력을 한눈에 확인하세요
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="glass px-6 py-12 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              subscriptionApi
                .getTimeline()
                .then((data) => setEvents(data.events))
                .catch(() => setError("히스토리를 불러오는데 실패했습니다."))
                .finally(() => setLoading(false));
            }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            다시 시도
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="glass px-6 py-12 text-center">
          <Clock className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-400">아직 구독 히스토리가 없습니다</p>
        </div>
      ) : (
        <div className="relative pl-8">
          {/* Timeline vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-300 via-blue-200 to-transparent" />

          <div className="flex flex-col gap-4">
            {events.map((event) => {
              const { icon: Icon, color, bg } = getEventIcon(event);
              return (
                <div key={event.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-8 top-4 flex h-[30px] w-[30px] items-center justify-center rounded-full ${bg} ring-4 ring-[#F0F4FA]`}
                  >
                    <Icon size={15} className={color} strokeWidth={2.2} />
                  </div>

                  {/* Event card */}
                  <div className="glass px-5 py-4 !rounded-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 leading-relaxed">
                          {event.description}
                        </p>

                        {(event.old_value || event.new_value) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {event.old_value && (
                              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                {event.old_value}
                              </span>
                            )}
                            {event.old_value && event.new_value && (
                              <ArrowRightLeft
                                size={12}
                                className="text-slate-400 shrink-0"
                              />
                            )}
                            {event.new_value && (
                              <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                {event.new_value}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <RelativeTime dateStr={event.created_at} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
