import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { reportsController } from "./reports.controller";
import {
  bookingExportQuerySchema,
  bookingReportQuerySchema,
  monthlyAnalyticsQuerySchema,
  travelRequestExportQuerySchema,
  travelRequestReportQuerySchema,
} from "./reports.validation";

export const adminReportsRouter = Router();

// Apply authentication and admin role authorization to all report routes
adminReportsRouter.use(authenticate, authorize("ADMIN"));

/**
 * @route   GET /api/admin/reports/summary
 * @desc    Dashboard overview statistics and KPIs
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/summary",
  reportsController.getDashboardSummary.bind(reportsController)
);

/**
 * @route   GET /api/admin/reports/monthly
 * @desc    12-month travel request and booking analytics
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/monthly",
  validate({ query: monthlyAnalyticsQuerySchema }),
  reportsController.getMonthlyAnalytics.bind(reportsController)
);

/**
 * @route   GET /api/admin/reports/departments
 * @desc    Department-level travel volume, spend, and approval rates
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/departments",
  reportsController.getDepartmentAnalytics.bind(reportsController)
);

/**
 * @route   GET /api/admin/reports/vendors
 * @desc    Vendor booking volume, total spend, and average fares
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/vendors",
  reportsController.getVendorAnalytics.bind(reportsController)
);

/**
 * @route   GET /api/admin/reports/travel-requests
 * @desc    Paginated, filterable travel request report
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/travel-requests",
  validate({ query: travelRequestReportQuerySchema }),
  reportsController.getTravelRequestsReport.bind(reportsController)
);

/**
 * @route   GET /api/admin/reports/bookings
 * @desc    Paginated, filterable flight booking report
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/bookings",
  validate({ query: bookingReportQuerySchema }),
  reportsController.getBookingsReport.bind(reportsController)
);

/**
 * @route   GET /api/admin/reports/travel-requests/export
 * @desc    Export travel requests report as Excel workbook (.xlsx)
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/travel-requests/export",
  validate({ query: travelRequestExportQuerySchema }),
  reportsController.exportTravelRequestsExcel.bind(reportsController)
);

/**
 * @route   GET /api/admin/reports/bookings/export
 * @desc    Export flight bookings report as Excel workbook (.xlsx)
 * @access  Private (Admin)
 */
adminReportsRouter.get(
  "/bookings/export",
  validate({ query: bookingExportQuerySchema }),
  reportsController.exportBookingsExcel.bind(reportsController)
);

export default adminReportsRouter;
