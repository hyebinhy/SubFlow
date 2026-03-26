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
} from "date-fns";
import type { Subscription } from "../../types/subscription";

interface Props {
  subscriptions: Subscription[];
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function RenewalCalendar({ subscriptions }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const renewalMap = new Map<string, Subscription[]>();
  subscriptions.forEach((sub) => {
    const key = sub.next_billing_date;
    if (!renewalMap.has(key)) renewalMap.set(key, []);
    renewalMap.get(key)!.push(sub);
  });

  return (
    <div className="glass p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="rounded-lg px-3 py-1 text-slate-500 hover:bg-white/40"
        >
          &lt;
        </button>
        <h3 className="font-semibold text-slate-900">
          {format(currentMonth, "yyyy년 MM월")}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="rounded-lg px-3 py-1 text-slate-500 hover:bg-white/40"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-slate-400"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const renewals = renewalMap.get(dateKey) || [];
          const hasRenewal = renewals.length > 0;

          return (
            <div
              key={dateKey}
              className={`relative rounded-lg p-2 text-center text-sm ${
                !isSameMonth(day, currentMonth) ? "text-gray-300" : ""
              } ${isToday(day) ? "bg-blue-50 font-bold text-blue-700" : ""} ${
                hasRenewal ? "bg-orange-50" : ""
              }`}
              title={
                hasRenewal
                  ? renewals.map((s) => `${s.service_name}: ${s.cost}원`).join("\n")
                  : undefined
              }
            >
              {format(day, "d")}
              {hasRenewal && (
                <div className="mt-0.5 flex justify-center gap-0.5">
                  {renewals.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: s.category?.color ?? "#F97316",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {Array.from(renewalMap.entries())
          .filter(([key]) => {
            const d = new Date(key);
            return isSameMonth(d, currentMonth);
          })
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateKey, subs]) => (
            <div key={dateKey} className="rounded-lg bg-white/40 px-3 py-2">
              <p className="text-xs font-medium text-slate-400">
                {format(new Date(dateKey), "MM월 dd일")}
              </p>
              {subs.map((s) => (
                <p key={s.id} className="text-sm text-slate-900">
                  {s.category?.icon ?? "💳"} {s.service_name} -{" "}
                  {new Intl.NumberFormat("ko-KR").format(s.cost)}원
                </p>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
