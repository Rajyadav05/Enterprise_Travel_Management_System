import { apiClient } from "./client";
import type {
  PaginatedData,
  RequestStatus,
  TravelRequest,
  TripType,
} from "../types";

export interface CreateTravelRequestPayload {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  tripType: TripType;
  purpose: string;
  additionalInfo?: string;
}

export interface TravelRequestQueryParams {
  status?: RequestStatus | string;
  departmentId?: string;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export const travelApi = {
  // Employee endpoints
  createRequest: async (
    data: CreateTravelRequestPayload
  ): Promise<TravelRequest> => {
    return apiClient<TravelRequest>("/travel/requests", {
      method: "POST",
      body: data,
    });
  },

  getMyRequests: async (
    params?: TravelRequestQueryParams
  ): Promise<TravelRequest[]> => {
    return apiClient<TravelRequest[]>("/travel/requests", {
      method: "GET",
      params: params as Record<string, string | number>,
    });
  },

  getRequestById: async (id: string): Promise<TravelRequest> => {
    return apiClient<TravelRequest>(`/travel/requests/${id}`, {
      method: "GET",
    });
  },

  cancelRequest: async (id: string): Promise<TravelRequest> => {
    return apiClient<TravelRequest>(`/travel/requests/${id}/cancel`, {
      method: "PATCH",
    });
  },

  // Admin endpoints
  adminListRequests: async (
    params?: TravelRequestQueryParams
  ): Promise<PaginatedData<TravelRequest>> => {
    return apiClient<PaginatedData<TravelRequest>>("/admin/travel/requests", {
      method: "GET",
      params: params as Record<string, string | number>,
    });
  },

  adminGetRequestById: async (id: string): Promise<TravelRequest> => {
    return apiClient<TravelRequest>(`/admin/travel/requests/${id}`, {
      method: "GET",
    });
  },

  adminApproveRequest: async (id: string): Promise<TravelRequest> => {
    return apiClient<TravelRequest>(`/admin/travel/requests/${id}/approve`, {
      method: "PATCH",
    });
  },

  adminRejectRequest: async (
    id: string,
    rejectionReason: string
  ): Promise<TravelRequest> => {
    return apiClient<TravelRequest>(`/admin/travel/requests/${id}/reject`, {
      method: "PATCH",
      body: { rejectionReason },
    });
  },
};
