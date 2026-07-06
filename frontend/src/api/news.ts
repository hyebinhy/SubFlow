import apiClient from "./client";

export interface NewsItem {
  title: string;
  link: string;
  pub_date: string;
  source: string;
  image_url: string | null;
  category: string;
  matched?: boolean;
}

export interface NewsResponse {
  items: NewsItem[];
}

export const getNews = async (): Promise<NewsResponse> => {
  const { data } = await apiClient.get("/news/");
  return data;
};

export interface NewsSummary {
  summary: string | null;
  mode: "ai" | "unavailable";
}

export const getNewsSummary = async (
  item: Pick<NewsItem, "title" | "link" | "source" | "category">
): Promise<NewsSummary> => {
  const { data } = await apiClient.post("/news/summary", {
    title: item.title,
    link: item.link,
    source: item.source,
    category: item.category,
  });
  return data;
};
