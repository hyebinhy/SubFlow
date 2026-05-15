import { useEffect, useState } from "react";
import { getNews } from "../api/news";
import type { NewsItem } from "../api/news";

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const data = await getNews();
        setNews(data.items);
        setError(null);
      } catch (err) {
        setError("뉴스를 불러오지 못했습니다.");
        console.error("Failed to fetch news:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return { news, loading, error };
}
