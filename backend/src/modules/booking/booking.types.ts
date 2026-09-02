import type { BookingVendor, Prisma } from "@prisma/client";

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateBookingInput {
  airline: string;
  flightNumber: string;
  pnr: string;
  ticketNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDatetime: Date;
  arrivalDatetime: Date;
  fare: number;
  currency: string;
  seat?: string | null;
  baggage?: string | null;
  vendor: BookingVendor;
  bookingSource: string;
}

// ─── Reusable Prisma Select / Include Shapes ──────────────────────────────────

/**
 * Organization summary for employee attached to booking details.
 */
export const bookingEmployeeOrgSelect = {
  id: true,
  employeeId: true,
  firstName: true,
  lastName: true,
  status: true,
  department: {
    select: {
      id: true,
      name: true,
    },
  },
  designation: {
    select: {
      id: true,
      name: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      country: true,
    },
  },
} satisfies Prisma.EmployeeSelect;

/**
 * Travel request summary for admin booking detail.
 */
export const bookingTravelRequestInclude = {
  employee: {
    select: bookingEmployeeOrgSelect,
  },
} satisfies Prisma.TravelRequestInclude;

/**
 * Full Prisma include for Admin Booking detail endpoint.
 */
export const adminBookingDetailInclude = {
  travelRequest: {
    include: bookingTravelRequestInclude,
  },
} satisfies Prisma.BookingInclude;

/**
 * Safe include for Employee Booking detail endpoint.
 */
export const employeeBookingDetailInclude = {
  travelRequest: {
    select: {
      id: true,
      origin: true,
      destination: true,
      departureDate: true,
      returnDate: true,
      tripType: true,
      purpose: true,
      status: true,
      employeeId: true,
    },
  },
} satisfies Prisma.BookingInclude;

// ─── Inferred Response Types ─────────────────────────────────────────────────

export type AdminBookingDetail = Prisma.BookingGetPayload<{
  include: typeof adminBookingDetailInclude;
}>;

export type EmployeeBookingDetail = Prisma.BookingGetPayload<{
  include: typeof employeeBookingDetailInclude;
}>;
