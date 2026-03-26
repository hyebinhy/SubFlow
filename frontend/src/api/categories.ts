import type { Category } from "../types/category";
import apiClient from "./client";

export const categoryApi = {
  getAll: () =>
    apiClient.get<Category[]>("/categories").then((r) => r.data),

  create: (data: { name: string; icon?: string; color?: string }) =>
    apiClient.post<Category>("/categories", data).then((r) => r.data),
};
