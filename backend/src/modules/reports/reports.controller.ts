import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  AUDIT_ACTIONS,
  HTTP_STATUS,
  RESPONSE_MESSAGES,
} from "../../utils/constants";
import { auditService } from "../audit/audit.service";
import { reportsService } from "./reports.service";
import type {
  BookingExportQuery,
  BookingReportQuery,
  MonthlyAnalyticsQuery,
  TravelRequestExportQuery,
  TravelRequestReportQuery,
} from "./reports.validation";

export class ReportsController {
  // ─── GET /api/admin/reports/summary ─────────────────────────────────────────

  public async getDashboardSummary(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await reportsService.getDashboardSummary();

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.REPORTS_SUMMARY_FETCHED,
        summary
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/reports/monthly ─────────────────────────────────────────

  public async getMonthlyAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as MonthlyAnalyticsQuery;
      const year = query.year ?? new Date().getFullYear();

      const monthlyData = await reportsService.getMonthlyAnalytics(year);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.REPORTS_MONTHLY_FETCHED,
        monthlyData
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/reports/departments ─────────────────────────────────────

  public async getDepartmentAnalytics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deptData = await reportsService.getDepartmentAnalytics();

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.REPORTS_DEPARTMENTS_FETCHED,
        deptData
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/reports/vendors ─────────────────────────────────────────

  public async getVendorAnalytics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const vendorData = await reportsService.getVendorAnalytics();

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.REPORTS_VENDORS_FETCHED,
        vendorData
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/reports/travel-requests ─────────────────────────────────

  public async getTravelRequestsReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as TravelRequestReportQuery;

      const report = await reportsService.getTravelRequestsReport({
        status: query.status,
        departmentId: query.departmentId,
        employeeId: query.employeeId,
        fromDate: query.fromDate,
        toDate: query.toDate,
        page: query.page,
        limit: query.limit,
      });

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.REPORTS_TRAVEL_REQUESTS_FETCHED,
        report
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/reports/bookings ────────────────────────────────────────

  public async getBookingsReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as BookingReportQuery;

      const report = await reportsService.getBookingsReport({
        vendor: query.vendor,
        departmentId: query.departmentId,
        employeeId: query.employeeId,
        fromDate: query.fromDate,
        toDate: query.toDate,
        page: query.page,
        limit: query.limit,
      });

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.REPORTS_BOOKINGS_FETCHED,
        report
      );
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/reports/travel-requests/export ──────────────────────────

  public async exportTravelRequestsExcel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as TravelRequestExportQuery;

      const buffer = await reportsService.exportTravelRequestsExcel({
        status: query.status,
        departmentId: query.departmentId,
        employeeId: query.employeeId,
        fromDate: query.fromDate,
        toDate: query.toDate,
      });

      const today = new Date().toISOString().split("T")[0];
      const filename = `ETMS_Travel_Requests_${today}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      void auditService.createAuditLog({
        actorUserId: req.user?.id ?? null,
        action: AUDIT_ACTIONS.REPORT_EXPORTED,
        entityType: "Report",
        metadata: {
          reportType: "TRAVEL_REQUESTS_EXCEL",
          filters: {
            status: query.status,
            departmentId: query.departmentId,
            employeeId: query.employeeId,
            fromDate: query.fromDate,
            toDate: query.toDate,
          },
        },
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // ─── GET /api/admin/reports/bookings/export ─────────────────────────────────

  public async exportBookingsExcel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as BookingExportQuery;

      const buffer = await reportsService.exportBookingsExcel({
        vendor: query.vendor,
        departmentId: query.departmentId,
        employeeId: query.employeeId,
        fromDate: query.fromDate,
        toDate: query.toDate,
      });

      const today = new Date().toISOString().split("T")[0];
      const filename = `ETMS_Bookings_${today}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      void auditService.createAuditLog({
        actorUserId: req.user?.id ?? null,
        action: AUDIT_ACTIONS.REPORT_EXPORTED,
        entityType: "Report",
        metadata: {
          reportType: "BOOKINGS_EXCEL",
          filters: {
            vendor: query.vendor,
            departmentId: query.departmentId,
            employeeId: query.employeeId,
            fromDate: query.fromDate,
            toDate: query.toDate,
          },
        },
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
