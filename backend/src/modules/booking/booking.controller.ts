import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constants";
import { bookingService } from "./booking.service";
import type { CreateBookingInput } from "./booking.types";
import type { CreateBookingSchema } from "./booking.validation";

/**
 * Helper to safely extract a single string route parameter.
 */
const getParamId = (param: string | string[] | undefined): string => {
  const val = Array.isArray(param) ? param[0] : param;
  if (!val || typeof val !== "string" || val.trim().length === 0) {
    throw ApiError.badRequest("ID parameter is required");
  }
  return val.trim();
};

export class BookingController {
  // ─── POST /api/admin/travel/requests/:id/booking ───────────────────────────

  public async createBooking(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const travelRequestId = getParamId(req.params.id);
      const body = req.body as CreateBookingSchema;

      const input: CreateBookingInput = {
        airline: body.airline,
        flightNumber: body.flightNumber,
        pnr: body.pnr,
        ticketNumber: body.ticketNumber,
        departureAirport: body.departureAirport,
        arrivalAirport: body.arrivalAirport,
        departureDatetime: body.departureDatetime,
        arrivalDatetime: body.arrivalDatetime,
        fare: body.fare,
        currency: body.currency,
        seat: body.seat ?? null,
        baggage: body.baggage ?? null,
        vendor: body.vendor,
        bookingSource: body.bookingSource,
      };

      const result = await bookingService.createBooking(travelRequestId, input);

      ApiResponse.send(
        res,
        HTTP_STATUS.CREATED,
        RESPONSE_MESSAGES.BOOKING_CREATED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/travel/requests/:id/booking ─────────────────────────────────

  public async getBookingForTravelRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const travelRequestId = getParamId(req.params.id);
      const isAdmin = req.user.role.name.toUpperCase() === "ADMIN";

      const result = await bookingService.getBookingForTravelRequest(
        travelRequestId,
        req.user.id,
        isAdmin
      );

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.BOOKING_FETCHED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/bookings/:id ──────────────────────────────────────────

  public async getAdminBookingById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bookingId = getParamId(req.params.id);

      const result = await bookingService.getAdminBookingById(bookingId);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.BOOKING_FETCHED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── POST /api/admin/bookings/:id/ticket ──────────────────────────────────

  public async uploadTicket(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bookingId = getParamId(req.params.id);

      if (!req.file) {
        throw ApiError.badRequest("Ticket file is required.");
      }

      // Relative path to store in database (normalized with forward slashes)
      const relativePath = `uploads/tickets/${req.file.filename}`;

      const result = await bookingService.uploadTicket(bookingId, relativePath);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TICKET_UPLOADED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/travel/bookings/:id/ticket ──────────────────────────────────

  public async getTicketFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const bookingId = getParamId(req.params.id);
      const isAdmin = req.user.role.name.toUpperCase() === "ADMIN";

      const fileInfo = await bookingService.getTicketFile(
        bookingId,
        req.user.id,
        isAdmin
      );

      res.setHeader("Content-Type", fileInfo.mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileInfo.fileName}"`
      );

      return res.sendFile(fileInfo.absolutePath);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
