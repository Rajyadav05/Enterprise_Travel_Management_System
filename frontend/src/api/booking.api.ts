import { apiClient, apiDownload, apiUpload } from "./client";
import type { Booking, BookingVendor } from "../types";

export interface CreateBookingPayload {
  airline: string;
  flightNumber: string;
  pnr: string;
  ticketNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDatetime: string;
  arrivalDatetime: string;
  fare: number;
  currency: string;
  seat?: string;
  baggage?: string;
  vendor: BookingVendor;
  bookingSource?: string;
}

export const bookingApi = {
  // Employee: get booking for their approved/booked request
  getBookingForRequest: async (travelRequestId: string): Promise<Booking> => {
    return apiClient<Booking>(`/travel/bookings/${travelRequestId}`, {
      method: "GET",
    });
  },

  // Admin: create booking for approved travel request
  adminCreateBooking: async (
    travelRequestId: string,
    data: CreateBookingPayload
  ): Promise<Booking> => {
    return apiClient<Booking>(`/admin/travel/requests/${travelRequestId}/booking`, {
      method: "POST",
      body: data,
    });
  },

  // Admin: get booking by booking ID
  adminGetBookingById: async (id: string): Promise<Booking> => {
    return apiClient<Booking>(`/admin/bookings/${id}`, {
      method: "GET",
    });
  },

  // Admin: upload ticket file
  adminUploadTicket: async (
    bookingId: string,
    file: File
  ): Promise<Booking> => {
    const formData = new FormData();
    formData.append("ticket", file);
    return apiUpload<Booking>(`/admin/bookings/${bookingId}/ticket`, formData);
  },

  // Download ticket file (authenticated)
  downloadTicket: async (
    bookingId: string,
    filename: string = "ticket.pdf"
  ): Promise<void> => {
    return apiDownload(
      `/travel/bookings/${bookingId}/ticket`,
      filename
    );
  },
};
