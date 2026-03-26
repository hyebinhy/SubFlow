import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Subscription } from "../../types/subscription";
import type { CalendarEvent } from "../../types/subscription";

interface Props {
  subscriptions: Subscription[];
  calendarEvents?: CalendarEvent[];
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const fmtCost = (cost: number, currency: string) =>
  currency === "KRW"
    ? `${new Intl.NumberFormat("ko-KR").format(cost)}원`
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cost);

interface CalendarEntry {
  id: string;
  service_name: string;
  logo_url?: string;
  cost: number;
  currency: string;
  category_name?: string;
  category_color?: string;
  date: string;
  is_past: boolean;
  is_recurring: boolean;
}

function buildEntriesFromEvents(events: CalendarEvent[]): CalendarEntry[] {
  return events.map((e) => ({
    id: e.subscription_id,
    service_name: e.service_name,
    logo_url: e.logo_url,
    cost: Number(e.cost),
    currency: e.currency,
    category_name: e.category_name,
    category_color: e.category_color,
    date: e.date,
    is_past: e.is_past,
    is_recurring: e.is_recurring,
  }));
}

function buildEntriesFromSubscriptions(subs: Subscription[]): CalendarEntry[] {
  return subs.map((s) => ({
    id: s.id,
    service_name: s.service_name,
    logo_url: s.logo_url,
    cost: Number(s.cost),
    currency: s.currency,
    category_name: s.category?.name,
    category_color: s.category?.color,
    date: s.next_billing_date,
    is_past: false,
    is_recurring: s.is_recurring ?? true,
  }));
}

export default function RenewalCalendar({ subscriptions, calendarEvents }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  // Build unified entries from calendarEvents (preferred) or subscriptions fallback
  const entries: CalendarEntry[] = calendarEvents && calendarEvents.length > 0
    ? buildEntriesFromEvents(calendarEvents)
    : buildEntriesFromSubscriptions(subscriptions);

  // Build renewal map: date string -> entries[]
  const renewalMap = new Map<string, CalendarEntry[]>();
  entries.forEach((entry) => {
    const key = entry.date;
    if (!renewalMap.has(key)) renewalMap.set(key, []);
    renewalMap.get(key)!.push(entry);
  });

  // This month's renewals sorted by date
  const monthRenewals = Array.from(renewalMap.entries())
    .filter(([key]) => isSameMonth(new Date(key), currentMonth))
    .sort(([a], [b]) => a.localeCompare(b));

  // Selected date renewals
  const selectedRenewals = selectedDate
    ? renewalMap.get(format(selectedDate, "yyyy-MM-dd")) || []
    : [];

  // Month totals by currency
  const monthTotals = new Map<string, number>();
  monthRenewals.forEach(([, items]) => {
    items.forEach((item) => {
      const cur = item.currency || "KRW";
      monthTotals.set(cur, (monthTotals.get(cur) || 0) + Number(item.cost));
    });
  });

  const totalCount = monthRenewals.reduce((sum, [, items]) => sum + items.length, 0);

  // Check if a date has any past events
  const dateHasPastOnly = (dateKey: string): boolean => {
    const items = renewalMap.get(dateKey) || [];
    return items.length > 0 && items.every((i) => i.is_past);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar - 2 cols wide */}
      <div className="glass p-6 lg:col-span-2">
        {/* Month nav */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => { setCurrentMonth((m) => subMonths(m, 1)); setSelectedDate(null); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/50 hover:text-slate-700"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-lg font-bold text-slate-900">
            {format(currentMonth, "yyyy년 MM월")}
          </h3>
          <button
            onClick={() => { setCurrentMonth((m) => addMonths(m, 1)); setSelectedDate(null); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/50 hover:text-slate-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-semibold ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-18" />
          ))}

          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const renewals = renewalMap.get(dateKey) || [];
            const hasRenewal = renewals.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            const isPastOnly = dateHasPastOnly(dateKey);

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(hasRenewal ? day : null)}
                className={`relative flex h-18 flex-col rounded-lg p-1 transition-all duration-150 ${
                  isSelected
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : today
                      ? "bg-indigo-50 font-bold text-indigo-600 ring-1 ring-indigo-200"
                      : hasRenewal
                        ? isPastOnly
                          ? "bg-white/40 font-medium text-slate-700 opacity-60 hover:bg-white/60 hover:opacity-80 hover:shadow-sm"
                          : "bg-white/60 font-medium text-slate-900 hover:bg-white/80 hover:shadow-sm"
                        : "text-slate-500 hover:bg-white/30"
                } ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}`}
              >
                <span className="text-[11px] leading-none">{format(day, "d")}</span>
                {hasRenewal && (
                  <div className="mt-auto flex items-center gap-px">
                    {renewals.slice(0, 2).map((entry) =>
                      entry.logo_url ? (
                        <img
                          key={entry.id + dateKey}
                          src={entry.logo_url}
                          alt={entry.service_name}
                          className={`h-4 w-4 rounded object-cover ${isSelected ? "ring-1 ring-white/50" : ""} ${entry.is_past && !isSelected ? "opacity-60" : ""}`}
                        />
                      ) : (
                        <div
                          key={entry.id + dateKey}
                          className={`flex h-4 w-4 items-center justify-center rounded text-[7px] font-bold text-white ${isSelected ? "ring-1 ring-white/50" : ""} ${entry.is_past && !isSelected ? "opacity-60" : ""}`}
                          style={{ background: entry.category_color ?? "#6366F1" }}
                        >
                          {entry.service_name[0]}
                        </div>
                      )
                    )}
                    {renewals.length > 2 && (
                      <span className={`text-[8px] font-semibold ${isSelected ? "text-white/70" : "text-slate-400"}`}>
                        +{renewals.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-4">
        {/* Month summary */}
        <div className="glass p-5">
          <p className="text-xs font-medium text-slate-400">이번 달 결제 예정</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {totalCount}<span className="text-base font-semibold text-slate-400">건</span>
          </p>
          <div className="mt-3 h-px bg-slate-200/50" />
          <p className="mt-3 text-xs font-medium text-slate-400">예상 결제 금액</p>
          <div className="mt-1 space-y-0.5">
            {Array.from(monthTotals.entries()).map(([currency, total]) => (
              <p key={currency} className="text-xl font-bold gradient-text">
                {currency === "KRW"
                  ? `${new Intl.NumberFormat("ko-KR").format(Math.round(total))}원`
                  : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(total)}
              </p>
            ))}
            {monthTotals.size === 0 && (
              <p className="text-xl font-bold text-slate-300">0원</p>
            )}
          </div>
        </div>

        {/* Selected date detail */}
        {selectedDate && selectedRenewals.length > 0 && (
          <div className="glass p-5">
            <p className="text-sm font-semibold text-indigo-500">
              {format(selectedDate, "MM월 dd일")} 결제
            </p>
            <div className="mt-3 space-y-3">
              {selectedRenewals.map((entry) => (
                <div key={entry.id + entry.date} className={`flex items-center justify-between ${entry.is_past ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3">
                    {entry.logo_url ? (
                      <img src={entry.logo_url} alt={entry.service_name} className="h-9 w-9 rounded-xl object-cover shadow" />
                    ) : (
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl shadow"
                        style={{ background: `linear-gradient(135deg, ${entry.category_color ?? "#818CF8"}, ${entry.category_color ?? "#6366F1"})` }}
                      >
                        <span className="text-xs font-bold text-white">{entry.service_name[0]}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-slate-900">{entry.service_name}</p>
                        {entry.is_past && (
                          <Check size={12} className="text-green-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{entry.category_name ?? "미분류"}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{fmtCost(entry.cost, entry.currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly renewal list */}
        <div className="glass p-5">
          <p className="mb-3 text-sm font-semibold text-slate-900">
            {format(currentMonth, "M월")} 결제 일정
          </p>
          {monthRenewals.length === 0 ? (
            <p className="text-sm text-slate-400">이번 달 결제 예정이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {monthRenewals.map(([dateKey, items]) => (
                <div key={dateKey}>
                  <p className="mb-1 text-[11px] font-medium text-slate-400">
                    {format(new Date(dateKey), "d일 (EEE)")}
                  </p>
                  {items.map((entry) => (
                    <button
                      key={entry.id + dateKey}
                      onClick={() => setSelectedDate(new Date(dateKey))}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-white/50 ${
                        entry.is_past ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {entry.is_past && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                            <Check size={14} className="text-green-600" />
                          </div>
                        )}
                        {!entry.is_past && (
                          entry.logo_url ? (
                            <img src={entry.logo_url} alt={entry.service_name} className="h-7 w-7 rounded-lg object-cover" />
                          ) : (
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                              style={{ background: entry.category_color ?? "#6366F1" }}
                            >
                              {entry.service_name[0]}
                            </div>
                          )
                        )}
                        <span className={`text-sm font-medium ${entry.is_past ? "text-slate-500" : "text-slate-700"}`}>
                          {entry.service_name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {fmtCost(entry.cost, entry.currency)}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
