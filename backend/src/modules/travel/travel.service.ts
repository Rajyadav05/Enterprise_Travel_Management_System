import type { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { emailService } from "../../services/email.service";
import { ApiError } from "../../utils/ApiError";
import { AUDIT_ACTIONS, RESPONSE_MESSAGES } from "../../utils/constants";
import { auditService } from "../audit/audit.service";
import type {
  AdminListFilters,
  CreateTravelRequestInput,
  PaginatedTravelRequests,
  TravelRequestDetail,
  TravelRequestListItem,
} from "./travel.types";
import {
  travelRequestDetailInclude,
  travelRequestListInclude,
} from "./travel.types";

export class TravelService {
  // ─── Employee: Create Travel Request ──────────────────────────────────────

  /**
   * Creates a new travel request on behalf of the authenticated user.
   * Resolves the employee from the user ID; never trusts client-supplied employeeId.
   */
  public async createTravelRequest(
    userId: string,
    input: CreateTravelRequestInput
  ): Promise<TravelRequestDetail> {
    // Resolve the employee linked to this user account
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      throw ApiError.forbidden(RESPONSE_MESSAGES.TRAVEL_REQUEST_NO_EMPLOYEE);
    }

    if (employee.status !== "ACTIVE") {
      throw ApiError.forbidden(RESPONSE_MESSAGES.EMPLOYEE_INACTIVE);
    }

    const travelRequest = await prisma.travelRequest.create({
      data: {
        employeeId: employee.id, // always from the authenticated session
        origin: input.origin,
        destination: input.destination,
        departureDate: input.departureDate,
        returnDate: input.returnDate ?? null,
        tripType: input.tripType,
        purpose: input.purpose,
        additionalInfo: input.additionalInfo ?? null,
        status: "PENDING", // always forced server-side
      },
      include: travelRequestDetailInclude,
    });

    // Record persistent audit log
    void auditService.createAuditLog({
      actorUserId: userId,
      actorEmployeeId: employee.id,
      action: AUDIT_ACTIONS.TRAVEL_REQUEST_CREATED,
      entityType: "TravelRequest",
      entityId: travelRequest.id,
      metadata: {
        origin: travelRequest.origin,
        destination: travelRequest.destination,
        tripType: travelRequest.tripType,
        departureDate: travelRequest.departureDate,
        returnDate: travelRequest.returnDate,
        purpose: travelRequest.purpose,
      },
    });

    // Send asynchronous email notification to Administrator
    void emailService.sendTravelRequestNotification({
      requestId: travelRequest.id,
      employeeName: `${travelRequest.employee.firstName} ${travelRequest.employee.lastName}`,
      employeeId: travelRequest.employee.employeeId,
      department: travelRequest.employee.department.name,
      designation: travelRequest.employee.designation.name,
      origin: travelRequest.origin,
      destination: travelRequest.destination,
      departureDate: travelRequest.departureDate,
      returnDate: travelRequest.returnDate,
      tripType: travelRequest.tripType,
      purpose: travelRequest.purpose,
      additionalInfo: travelRequest.additionalInfo,
      status: travelRequest.status,
      createdAt: travelRequest.createdAt,
    });

    return travelRequest;
  }

  // ─── Employee: List Own Requests ──────────────────────────────────────────

  /**
   * Returns all travel requests belonging to the authenticated employee.
   * Sorted newest-first. The employee filter is derived from userId, never
   * from a client-supplied query parameter.
   */
  public async getMyTravelRequests(
    userId: string
  ): Promise<TravelRequestListItem[]> {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) {
      throw ApiError.forbidden(RESPONSE_MESSAGES.TRAVEL_REQUEST_NO_EMPLOYEE);
    }

    const requests = await prisma.travelRequest.findMany({
      where: { employeeId: employee.id },
      include: travelRequestListInclude,
      orderBy: { createdAt: "desc" },
    });

    return requests;
  }

  // ─── Employee/Admin: Get Single Request ───────────────────────────────────

  /**
   * Returns a single travel request by ID.
   * - Employees can only access their own request.
   * - Admins can access any request.
   * IDOR prevention: an employee trying to access another's request receives 404.
   */
  public async getTravelRequestById(
    requestId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<TravelRequestDetail> {
    const travelRequest = await prisma.travelRequest.findUnique({
      where: { id: requestId },
      include: travelRequestDetailInclude,
    });

    if (!travelRequest) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    if (!isAdmin) {
      // Resolve employee to compare ownership
      const employee = await prisma.employee.findUnique({
        where: { userId },
        select: { id: true },
      });

      // Return 404 (not 403) to not reveal whether a record exists
      if (!employee || travelRequest.employeeId !== employee.id) {
        throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
      }
    }

    return travelRequest;
  }

  // ─── Employee: Cancel Own Request ─────────────────────────────────────────

  /**
   * Cancels a PENDING travel request.
   * Only the request owner can cancel; only PENDING status is cancellable.
   */
  public async cancelTravelRequest(
    requestId: string,
    userId: string
  ): Promise<TravelRequestDetail> {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) {
      throw ApiError.forbidden(RESPONSE_MESSAGES.TRAVEL_REQUEST_NO_EMPLOYEE);
    }

    const travelRequest = await prisma.travelRequest.findUnique({
      where: { id: requestId },
    });

    if (!travelRequest) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    // Ownership check — return 404 to avoid leaking record existence
    if (travelRequest.employeeId !== employee.id) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    // Status guard
    if (travelRequest.status !== "PENDING") {
      throw ApiError.conflict(
        RESPONSE_MESSAGES.TRAVEL_REQUEST_INVALID_STATUS_TRANSITION
      );
    }

    const updated = await prisma.travelRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
      include: travelRequestDetailInclude,
    });

    // Record persistent audit log
    void auditService.createAuditLog({
      actorUserId: userId,
      actorEmployeeId: employee.id,
      action: AUDIT_ACTIONS.TRAVEL_REQUEST_CANCELLED,
      entityType: "TravelRequest",
      entityId: updated.id,
      oldValue: { status: "PENDING" },
      newValue: { status: "CANCELLED" },
    });

    return updated;
  }

  // ─── Admin: List All Requests ─────────────────────────────────────────────

  /**
   * Returns a paginated, filterable list of all travel requests.
   * Supports status, employeeId, departmentId, and date range filters.
   */
  public async adminListTravelRequests(
    filters: AdminListFilters
  ): Promise<PaginatedTravelRequests> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build Prisma where clause from optional filters
    const where: Prisma.TravelRequestWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.departmentId) {
      where.employee = {
        departmentId: filters.departmentId,
      };
    }

    if (filters.fromDate ?? filters.toDate) {
      where.departureDate = {};
      if (filters.fromDate) {
        where.departureDate.gte = filters.fromDate;
      }
      if (filters.toDate) {
        // Include the entire toDate day
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.departureDate.lte = endOfDay;
      }
    }

    const [requests, total] = await prisma.$transaction([
      prisma.travelRequest.findMany({
        where,
        include: travelRequestListInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.travelRequest.count({ where }),
    ]);

    return {
      data: requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Admin: Get Single Request (Full Detail) ──────────────────────────────

  /**
   * Returns full detail of a single travel request for admin consumption.
   * Includes employee, approver, and booking data.
   */
  public async adminGetTravelRequestById(
    requestId: string
  ): Promise<TravelRequestDetail> {
    const travelRequest = await prisma.travelRequest.findUnique({
      where: { id: requestId },
      include: travelRequestDetailInclude,
    });

    if (!travelRequest) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    return travelRequest;
  }

  // ─── Admin: Approve Request ───────────────────────────────────────────────

  /**
   * Approves a PENDING travel request.
   * Records the approving admin's employee ID and the approval timestamp.
   */
  public async approveTravelRequest(
    requestId: string,
    adminUserId: string
  ): Promise<TravelRequestDetail> {
    const adminEmployee = await this.resolveAdminEmployee(adminUserId);

    const travelRequest = await prisma.travelRequest.findUnique({
      where: { id: requestId },
    });

    if (!travelRequest) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    this.assertTransitionAllowed(travelRequest.status, "APPROVED");

    const updated = await prisma.travelRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: adminEmployee.id,
        approvalDate: new Date(),
        rejectionReason: null, // clear in case of re-use (future)
      },
      include: travelRequestDetailInclude,
    });

    // Record persistent audit log
    void auditService.createAuditLog({
      actorUserId: adminUserId,
      actorEmployeeId: adminEmployee.id,
      action: AUDIT_ACTIONS.TRAVEL_REQUEST_APPROVED,
      entityType: "TravelRequest",
      entityId: updated.id,
      oldValue: { status: "PENDING" },
      newValue: { status: "APPROVED" },
      metadata: {
        approvalDate: updated.approvalDate,
      },
    });

    // Send asynchronous approval notification to Employee
    void (async () => {
      try {
        const empUser = await prisma.employee.findUnique({
          where: { id: updated.employeeId },
          select: { user: { select: { email: true } } },
        });
        if (empUser?.user?.email) {
          const approverName = updated.approvedBy
            ? `${updated.approvedBy.firstName} ${updated.approvedBy.lastName}`
            : "Administration";
          await emailService.sendTravelApprovalNotification({
            requestId: updated.id,
            employeeEmail: empUser.user.email,
            employeeName: `${updated.employee.firstName} ${updated.employee.lastName}`,
            origin: updated.origin,
            destination: updated.destination,
            departureDate: updated.departureDate,
            returnDate: updated.returnDate,
            purpose: updated.purpose,
            approvedBy: approverName,
            approvalDate: updated.approvalDate ?? new Date(),
          });
        }
      } catch (err) {
        // Non-blocking
      }
    })();

    return updated;
  }

  // ─── Admin: Reject Request ────────────────────────────────────────────────

  /**
   * Rejects a PENDING travel request.
   * Records the rejecting admin's employee ID, timestamp, and the reason.
   * The field `approvedById` stores the admin who performed the action
   * (by existing schema design) regardless of approve/reject outcome.
   */
  public async rejectTravelRequest(
    requestId: string,
    adminUserId: string,
    rejectionReason: string
  ): Promise<TravelRequestDetail> {
    const adminEmployee = await this.resolveAdminEmployee(adminUserId);

    const travelRequest = await prisma.travelRequest.findUnique({
      where: { id: requestId },
    });

    if (!travelRequest) {
      throw ApiError.notFound(RESPONSE_MESSAGES.TRAVEL_REQUEST_NOT_FOUND);
    }

    this.assertTransitionAllowed(travelRequest.status, "REJECTED");

    const updated = await prisma.travelRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approvedById: adminEmployee.id,
        approvalDate: new Date(),
        rejectionReason,
      },
      include: travelRequestDetailInclude,
    });

    // Record persistent audit log
    void auditService.createAuditLog({
      actorUserId: adminUserId,
      actorEmployeeId: adminEmployee.id,
      action: AUDIT_ACTIONS.TRAVEL_REQUEST_REJECTED,
      entityType: "TravelRequest",
      entityId: updated.id,
      oldValue: { status: "PENDING" },
      newValue: { status: "REJECTED" },
      metadata: {
        rejectionReason,
      },
    });

    // Send asynchronous rejection notification to Employee
    void (async () => {
      try {
        const empUser = await prisma.employee.findUnique({
          where: { id: updated.employeeId },
          select: { user: { select: { email: true } } },
        });
        if (empUser?.user?.email) {
          const reviewerName = updated.approvedBy
            ? `${updated.approvedBy.firstName} ${updated.approvedBy.lastName}`
            : "Administration";
          await emailService.sendTravelRejectionNotification({
            requestId: updated.id,
            employeeEmail: empUser.user.email,
            employeeName: `${updated.employee.firstName} ${updated.employee.lastName}`,
            origin: updated.origin,
            destination: updated.destination,
            departureDate: updated.departureDate,
            returnDate: updated.returnDate,
            purpose: updated.purpose,
            rejectedBy: reviewerName,
            rejectionDate: updated.approvalDate ?? new Date(),
            rejectionReason: updated.rejectionReason ?? rejectionReason,
          });
        }
      } catch (err) {
        // Non-blocking
      }
    })();

    return updated;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Resolves the Employee record for a given admin user ID.
   * Throws 403 if no linked employee profile exists.
   */
  private async resolveAdminEmployee(adminUserId: string) {
    const employee = await prisma.employee.findUnique({
      where: { userId: adminUserId },
      select: { id: true },
    });

    if (!employee) {
      throw ApiError.forbidden(RESPONSE_MESSAGES.TRAVEL_REQUEST_NO_EMPLOYEE);
    }

    return employee;
  }

  /**
   * Enforces strict status transition rules.
   * Only PENDING requests may be moved to APPROVED, REJECTED, or CANCELLED.
   * Throws 409 Conflict if the transition is not permitted.
   */
  private assertTransitionAllowed(
    currentStatus: RequestStatus,
    targetStatus: "APPROVED" | "REJECTED" | "CANCELLED"
  ): void {
    if (currentStatus !== "PENDING") {
      throw ApiError.conflict(
        `Cannot set status to ${targetStatus}: request is already ${currentStatus}.`
      );
    }
  }
}

export const travelService = new TravelService();
