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
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Subscription } from "../../types/subscription";

interface Props {
  subscriptions: Subscription[];
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const fmtCost = (sub: Subscription) =>
  sub.currency === "KRW"
    ? `${new Intl.NumberFormat("ko-KR").format(sub.cost)}원`
    : new Intl.NumberFormat("en-US", { style: "currency", currency: sub.currency }).format(sub.cost);

export default function RenewalCalendar({ subscriptions }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  // Build renewal map
  const renewalMap = new Map<string, Subscription[]>();
  subscriptions.forEach((sub) => {
    const key = sub.next_billing_date;
    if (!renewalMap.has(key)) renewalMap.set(key, []);
    renewalMap.get(key)!.push(sub);
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
  monthRenewals.forEach(([, subs]) => {
    subs.forEach((sub) => {
      const cur = sub.currency || "KRW";
      monthTotals.set(cur, (monthTotals.get(cur) || 0) + Number(sub.cost));
    });
  });

  const totalCount = monthRenewals.reduce((sum, [, subs]) => sum + subs.length, 0);

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
            <div key={`empty-${i}`} className="h-14" />
          ))}

          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const renewals = renewalMap.get(dateKey) || [];
            const hasRenewal = renewals.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(hasRenewal ? day : null)}
                className={`relative flex h-14 flex-col rounded-lg p-1 transition-all duration-150 ${
                  isSelected
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : today
                      ? "bg-indigo-50 font-bold text-indigo-600 ring-1 ring-indigo-200"
                      : hasRenewal
                        ? "bg-white/60 font-medium text-slate-900 hover:bg-white/80 hover:shadow-sm"
                        : "text-slate-500 hover:bg-white/30"
                } ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}`}
              >
                <span className="text-[11px] leading-none">{format(day, "d")}</span>
                {hasRenewal && (
                  <div className="mt-auto flex items-center gap-px">
                    {renewals.slice(0, 2).map((s) =>
                      s.logo_url ? (
                        <img
                          key={s.id}
                          src={s.logo_url}
                          alt={s.service_name}
                          className={`h-4 w-4 rounded object-cover ${isSelected ? "ring-1 ring-white/50" : ""}`}
                        />
                      ) : (
                        <div
                          key={s.id}
                          className={`flex h-4 w-4 items-center justify-center rounded text-[7px] font-bold text-white ${isSelected ? "ring-1 ring-white/50" : ""}`}
                          style={{ background: s.category?.color ?? "#6366F1" }}
                        >
                          {s.service_name[0]}
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
              {selectedRenewals.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.service_name} className="h-9 w-9 rounded-xl object-cover shadow" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow">
                        <span className="text-xs font-bold text-white">{s.service_name[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{s.service_name}</p>
                      <p className="text-[11px] text-slate-400">{s.category?.name ?? "미분류"}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{fmtCost(s)}</p>
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
              {monthRenewals.map(([dateKey, subs]) => (
                <div key={dateKey}>
                  <p className="mb-1 text-[11px] font-medium text-slate-400">
                    {format(new Date(dateKey), "d일 (EEE)")}
                  </p>
                  {subs.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedDate(new Date(dateKey))}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-white/50"
                    >
                      <div className="flex items-center gap-2.5">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.service_name} className="h-7 w-7 rounded-lg object-cover" />
                        ) : (
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                            style={{ background: s.category?.color ?? "#6366F1" }}
                          >
                            {s.service_name[0]}
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-700">{s.service_name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{fmtCost(s)}</span>
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
