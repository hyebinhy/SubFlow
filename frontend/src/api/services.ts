import type { PlanPriceHistory, Service, ServiceListItem } from "../types/service";
import apiClient from "./client";

export const serviceApi = {
  getAll: (category_id?: number) =>
    apiClient
      .get<ServiceListItem[]>("/services", { params: { category_id } })
      .then((r) => r.data),

  getPopular: () =>
    apiClient.get<ServiceListItem[]>("/services/popular").then((r) => r.data),

  search: (q: string) =>
    apiClient
      .get<ServiceListItem[]>("/services/search", { params: { q } })
      .then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Service>(`/services/${id}`).then((r) => r.data),

  getPriceHistory: (serviceId: number) =>
    apiClient
      .get<Record<number, PlanPriceHistory[]>>(`/services/${serviceId}/price-history`)
      .then((r) => r.data),
};
