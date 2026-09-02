import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constants";
import { travelService } from "./travel.service";
import type {
  AdminListFilters,
  CreateTravelRequestInput,
} from "./travel.types";
import type {
  AdminListQuerySchema,
  CreateTravelRequestSchema,
  RejectTravelRequestSchema,
} from "./travel.validation";

/**
 * Extracts and validates a single string route parameter.
 */
const getParamId = (param: string | string[] | undefined): string => {
  const val = Array.isArray(param) ? param[0] : param;
  if (!val || typeof val !== "string" || val.trim().length === 0) {
    throw ApiError.badRequest("Request ID is required");
  }
  return val.trim();
};

export class TravelController {
  // ─── Employee Endpoints ────────────────────────────────────────────────────

  /**
   * POST /api/travel/requests
   * Creates a new travel request for the authenticated employee.
   */
  public async createRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const body = req.body as CreateTravelRequestSchema;

      const input: CreateTravelRequestInput = {
        origin: body.origin,
        destination: body.destination,
        departureDate: body.departureDate,
        returnDate: body.returnDate ?? null,
        tripType: body.tripType,
        purpose: body.purpose,
        additionalInfo: body.additionalInfo ?? null,
      };

      const result = await travelService.createTravelRequest(req.user.id, input);

      ApiResponse.send(
        res,
        HTTP_STATUS.CREATED,
        RESPONSE_MESSAGES.TRAVEL_REQUEST_CREATED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/travel/requests
   * Returns the authenticated employee's own travel requests.
   */
  public async listMyRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const requests = await travelService.getMyTravelRequests(req.user.id);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TRAVEL_REQUESTS_FETCHED,
        requests
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/travel/requests/:id
   * Returns a single travel request. Employee can only access their own.
   */
  public async getRequestById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const id = getParamId(req.params.id);
      const isAdmin = req.user.role.name.toUpperCase() === "ADMIN";

      const result = await travelService.getTravelRequestById(
        id,
        req.user.id,
        isAdmin
      );

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TRAVEL_REQUEST_FETCHED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/travel/requests/:id/cancel
   * Cancels a PENDING travel request. Only the owner may cancel.
   */
  public async cancelRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const id = getParamId(req.params.id);

      const result = await travelService.cancelTravelRequest(id, req.user.id);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TRAVEL_REQUEST_CANCELLED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── Admin Endpoints ───────────────────────────────────────────────────────

  /**
   * GET /api/admin/travel/requests
   * Returns a paginated, filtered list of all travel requests (admin only).
   */
  public async adminListRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as AdminListQuerySchema;

      const filters: AdminListFilters = {
        status: query.status,
        employeeId: query.employeeId,
        departmentId: query.departmentId,
        fromDate: query.fromDate,
        toDate: query.toDate,
        page: query.page,
        limit: query.limit,
      };

      const result = await travelService.adminListTravelRequests(filters);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TRAVEL_REQUESTS_FETCHED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/travel/requests/:id
   * Returns full detail of a single travel request (admin only).
   */
  public async adminGetRequestById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getParamId(req.params.id);

      const result = await travelService.adminGetTravelRequestById(id);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TRAVEL_REQUEST_FETCHED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/travel/requests/:id/approve
   * Approves a PENDING travel request (admin only).
   */
  public async approveRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const id = getParamId(req.params.id);

      const result = await travelService.approveTravelRequest(id, req.user.id);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TRAVEL_REQUEST_APPROVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/travel/requests/:id/reject
   * Rejects a PENDING travel request with a required reason (admin only).
   */
  public async rejectRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const id = getParamId(req.params.id);

      const body = req.body as RejectTravelRequestSchema;

      const result = await travelService.rejectTravelRequest(
        id,
        req.user.id,
        body.rejectionReason
      );

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.TRAVEL_REQUEST_REJECTED,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}

export const travelController = new TravelController();
