import { ExternalLink } from "lucide-react";
import type { NewsItem } from "../../api/news";

interface NewsWidgetProps {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
}

export default function NewsWidget({ news, loading, error }: NewsWidgetProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl bg-white/70 p-5 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl bg-rose-50 p-5 text-sm text-rose-500 shadow-sm">
        소식을 불러오지 못했습니다.
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl bg-white/70 p-5 text-sm text-slate-500 shadow-sm">
        최신 소식이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {news.slice(0, 4).map((item, idx) => {
        const isAI = item.category === "AI Updates";
        const bgClass = isAI
          ? "bg-gradient-to-br from-indigo-900 to-slate-900 text-white"
          : "bg-white text-slate-900";
        const label = isAI ? "AI 소식" : "구독 알림";

        return (
          <a
            key={`${item.title}-${idx}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl p-4 shadow-sm transition hover:shadow-md ${bgClass} ${
              idx >= 2 ? "col-span-2 h-32" : "col-span-1 h-48"
            }`}
          >
            {isAI && (
              <div
                className="absolute inset-0 z-0 opacity-25 mix-blend-overlay transition duration-500 group-hover:scale-105 group-hover:opacity-40"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}

            <div className="relative z-10 flex items-start justify-between gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  isAI ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                }`}
              >
                {label}
              </span>
            </div>

            <div className="relative z-10 mt-auto">
              <h3 className={`line-clamp-2 text-sm font-bold leading-tight ${isAI ? "text-white" : "text-slate-900"}`}>
                {item.title}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <p className={`w-2/3 truncate text-[10px] ${isAI ? "text-indigo-100" : "text-slate-500"}`}>
                  {item.source}
                </p>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    isAI ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
