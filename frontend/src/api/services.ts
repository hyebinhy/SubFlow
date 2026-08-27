import type {
  PlanPriceHistory,
  Service,
  ServiceCreateRequest,
  ServiceListItem,
} from "../types/service";
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

  create: (data: ServiceCreateRequest) =>
    apiClient.post<Service>("/services", data).then((r) => r.data),

  // 내가 등록한 서비스만 지울 수 있다 (기본 카탈로그는 404)
  remove: (id: number) => apiClient.delete(`/services/${id}`).then(() => undefined),
};
