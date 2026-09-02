import type {
  RequestStatus,
  TripType,
  Prisma,
} from "@prisma/client";

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateTravelRequestInput {
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date | null;
  tripType: TripType;
  purpose: string;
  additionalInfo?: string | null;
}

export interface AdminListFilters {
  status?: RequestStatus;
  employeeId?: string;
  departmentId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface RejectInput {
  rejectionReason: string;
}

// ─── Reusable Prisma Select Shapes ────────────────────────────────────────────

/**
 * Minimal employee summary included in request responses.
 * Excludes sensitive auth fields (passwordHash, userId).
 */
export const employeeSummarySelect = {
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
    },
  },
} satisfies Prisma.EmployeeSelect;

/**
 * Minimal approver summary (admin who approved/rejected).
 */
export const approverSummarySelect = {
  id: true,
  employeeId: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.EmployeeSelect;

/**
 * Full Prisma include for a single TravelRequest detail response.
 */
export const travelRequestDetailInclude = {
  employee: {
    select: employeeSummarySelect,
  },
  approvedBy: {
    select: approverSummarySelect,
  },
  booking: {
    select: {
      id: true,
      airline: true,
      flightNumber: true,
      pnr: true,
      ticketNumber: true,
      departureAirport: true,
      arrivalAirport: true,
      departureDatetime: true,
      arrivalDatetime: true,
      fare: true,
      currency: true,
      seat: true,
      baggage: true,
      vendor: true,
      bookingSource: true,
      bookingDate: true,
      ticketFilePath: true,
      createdAt: true,
    },
  },
} satisfies Prisma.TravelRequestInclude;

/**
 * Lighter include for list responses (no booking detail, no approver detail).
 */
export const travelRequestListInclude = {
  employee: {
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      department: {
        select: { id: true, name: true },
      },
    },
  },
  booking: {
    select: {
      id: true,
      airline: true,
      pnr: true,
    },
  },
} satisfies Prisma.TravelRequestInclude;

// ─── Response shape inferred from Prisma ─────────────────────────────────────

export type TravelRequestDetail = Prisma.TravelRequestGetPayload<{
  include: typeof travelRequestDetailInclude;
}>;

export type TravelRequestListItem = Prisma.TravelRequestGetPayload<{
  include: typeof travelRequestListInclude;
}>;

// ─── Paginated list wrapper ───────────────────────────────────────────────────

export interface PaginatedTravelRequests {
  data: TravelRequestListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
