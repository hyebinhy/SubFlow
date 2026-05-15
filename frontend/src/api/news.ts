import apiClient from "./client";

export interface NewsItem {
  title: string;
  link: string;
  pub_date: string;
  source: string;
  image_url: string | null;
  category: string;
}

export interface NewsResponse {
  items: NewsItem[];
}

export const getNews = async (): Promise<NewsResponse> => {
  const { data } = await apiClient.get("/news/");
  return data;
};
