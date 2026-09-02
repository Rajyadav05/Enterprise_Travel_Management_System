import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma";
import { emailService } from "../../services/email.service";
import { ApiError } from "../../utils/ApiError";
import { AUDIT_ACTIONS, RESPONSE_MESSAGES } from "../../utils/constants";
import { auditService } from "../audit/audit.service";
import type {
  AdminBookingDetail,
  CreateBookingInput,
  EmployeeBookingDetail,
} from "./booking.types";
import {
  adminBookingDetailInclude,
  employeeBookingDetailInclude,
} from "./booking.types";

export class BookingService {
  // ─── Admin: Create Booking ──────────────────────────────────────────────────

  /**
   * Creates a flight booking for an APPROVED travel request in an atomic transaction.
   * Updates the TravelRequest status to BOOKED.
   */
  public async createBooking(
    travelRequestId: string,
    input: CreateBookingInput
  ): Promise<AdminBookingDetail> {
    const travelRequest = await prisma.travelRequest.findUnique({
      where: { id: travelRequestId },
      include: { booking: { select: { id: true } } },
    });

    if (!travelRequest) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    if (travelRequest.status !== "APPROVED") {
      throw ApiError.conflict(
        `Cannot create booking: request is currently in ${travelRequest.status} status. Only APPROVED requests can be booked.`
      );
    }

    if (travelRequest.booking) {
      throw ApiError.conflict(RESPONSE_MESSAGES.BOOKING_ALREADY_EXISTS);
    }

    // Atomic transaction: Create Booking & Set TravelRequest.status = BOOKED
    const createdBooking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          travelRequestId,
          airline: input.airline,
          flightNumber: input.flightNumber,
          pnr: input.pnr,
          ticketNumber: input.ticketNumber,
          departureAirport: input.departureAirport,
          arrivalAirport: input.arrivalAirport,
          departureDatetime: input.departureDatetime,
          arrivalDatetime: input.arrivalDatetime,
          fare: input.fare,
          currency: input.currency,
          seat: input.seat ?? null,
          baggage: input.baggage ?? null,
          vendor: input.vendor,
          bookingSource: input.bookingSource,
          bookingDate: new Date(),
          ticketFilePath: null,
        },
      });

      await tx.travelRequest.update({
        where: { id: travelRequestId },
        data: { status: "BOOKED" },
      });

      return newBooking;
    });

    // Retrieve full detail for response
    const fullBooking = await prisma.booking.findUniqueOrThrow({
      where: { id: createdBooking.id },
      include: adminBookingDetailInclude,
    });

    // Record persistent audit log
    void auditService.createAuditLog({
      action: AUDIT_ACTIONS.BOOKING_CREATED,
      entityType: "Booking",
      entityId: fullBooking.id,
      metadata: {
        travelRequestId: fullBooking.travelRequestId,
        airline: fullBooking.airline,
        flightNumber: fullBooking.flightNumber,
        pnr: fullBooking.pnr,
        fare: Number(fullBooking.fare),
        currency: fullBooking.currency,
        vendor: fullBooking.vendor,
      },
    });

    // Send asynchronous booking confirmation email to Employee
    void (async () => {
      try {
        const empUser = await prisma.employee.findUnique({
          where: { id: fullBooking.travelRequest.employeeId },
          select: { user: { select: { email: true } } },
        });
        if (empUser?.user?.email) {
          await emailService.sendBookingConfirmation({
            requestId: fullBooking.travelRequest.id,
            bookingId: fullBooking.id,
            employeeEmail: empUser.user.email,
            employeeName: `${fullBooking.travelRequest.employee.firstName} ${fullBooking.travelRequest.employee.lastName}`,
            origin: fullBooking.travelRequest.origin,
            destination: fullBooking.travelRequest.destination,
            airline: fullBooking.airline,
            flightNumber: fullBooking.flightNumber,
            pnr: fullBooking.pnr,
            ticketNumber: fullBooking.ticketNumber,
            departureAirport: fullBooking.departureAirport,
            arrivalAirport: fullBooking.arrivalAirport,
            departureDatetime: fullBooking.departureDatetime,
            arrivalDatetime: fullBooking.arrivalDatetime,
            fare: fullBooking.fare.toString(),
            currency: fullBooking.currency,
            seat: fullBooking.seat,
            baggage: fullBooking.baggage,
            vendor: fullBooking.vendor,
            bookingSource: fullBooking.bookingSource ?? "Corporate Travel Desk",
            bookingDate: fullBooking.bookingDate,
            hasTicketFile: !!fullBooking.ticketFilePath,
          });
        }
      } catch (err) {
        // Non-blocking
      }
    })();

    return fullBooking;
  }

  // ─── Employee: Get Booking for Travel Request ───────────────────────────────

  /**
   * Retrieves booking details for a travel request.
   * Employees can access only their own booking (IDOR safe: returns 404).
   * Admins can access any booking.
   */
  public async getBookingForTravelRequest(
    travelRequestId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<EmployeeBookingDetail> {
    const travelRequest = await prisma.travelRequest.findUnique({
      where: { id: travelRequestId },
      select: { id: true, employeeId: true },
    });

    if (!travelRequest) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    if (!isAdmin) {
      const employee = await prisma.employee.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!employee || travelRequest.employeeId !== employee.id) {
        throw ApiError.notFound(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { travelRequestId },
      include: employeeBookingDetailInclude,
    });

    if (!booking) {
      throw ApiError.notFound(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    return booking;
  }

  // ─── Admin: Get Booking by ID ───────────────────────────────────────────────

  /**
   * Retrieves complete booking details with full organization relations for admin.
   */
  public async getAdminBookingById(
    bookingId: string
  ): Promise<AdminBookingDetail> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: adminBookingDetailInclude,
    });

    if (!booking) {
      throw ApiError.notFound(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    return booking;
  }

  // ─── Admin: Upload Ticket ───────────────────────────────────────────────────

  /**
   * Records the stored ticket file path for a booking.
   * Rejects if a ticket is already uploaded.
   */
  public async uploadTicket(
    bookingId: string,
    relativeFilePath: string
  ): Promise<AdminBookingDetail> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw ApiError.notFound(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    if (booking.ticketFilePath) {
      throw ApiError.conflict(RESPONSE_MESSAGES.TICKET_ALREADY_EXISTS);
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { ticketFilePath: relativeFilePath },
      include: adminBookingDetailInclude,
    });

    // Record persistent audit log
    void auditService.createAuditLog({
      action: AUDIT_ACTIONS.TICKET_UPLOADED,
      entityType: "Booking",
      entityId: updated.id,
      metadata: {
        bookingId: updated.id,
        pnr: updated.pnr,
        hasTicketFile: true,
      },
    });

    return updated;
  }

  // ─── Ticket Access (Download / View) ────────────────────────────────────────

  /**
   * Validates authorization and returns the absolute path and metadata for a ticket file.
   * IDOR-safe: non-admin employees can access only their own ticket.
   */
  public async getTicketFile(
    bookingId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<{ absolutePath: string; fileName: string; mimeType: string }> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        travelRequest: {
          select: { employeeId: true },
        },
      },
    });

    if (!booking) {
      throw ApiError.notFound(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    if (!isAdmin) {
      const employee = await prisma.employee.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!employee || booking.travelRequest.employeeId !== employee.id) {
        throw ApiError.notFound(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
      }
    }

    if (!booking.ticketFilePath) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TICKET_NOT_FOUND);
    }

    // Resolve absolute path and prevent path traversal
    const uploadsBase = path.resolve(process.cwd(), "uploads", "tickets");
    const absolutePath = path.resolve(process.cwd(), booking.ticketFilePath);

    if (!absolutePath.startsWith(uploadsBase)) {
      throw ApiError.forbidden("Invalid file path resolution.");
    }

    if (!fs.existsSync(absolutePath)) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TICKET_NOT_FOUND);
    }

    const ext = path.extname(absolutePath).toLowerCase();
    let mimeType = "application/octet-stream";
    if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".png") mimeType = "image/png";

    const fileName = path.basename(absolutePath);

    return { absolutePath, fileName, mimeType };
  }
}

export const bookingService = new BookingService();
