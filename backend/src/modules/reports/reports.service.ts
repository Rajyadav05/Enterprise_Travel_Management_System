import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type {
  BookingReportFilters,
  DashboardSummary,
  DepartmentAnalyticsItem,
  MonthlyAnalyticsItem,
  PaginatedReport,
  TravelRequestReportFilters,
  VendorAnalyticsItem,
} from "./reports.types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export class ReportsService {
  // ─── 1. Dashboard Summary ───────────────────────────────────────────────────

  public async getDashboardSummary(): Promise<DashboardSummary> {
    const [
      totalTravelRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      cancelledRequests,
      bookedRequests,
      totalBookings,
      fareAggregate,
    ] = await Promise.all([
      prisma.travelRequest.count(),
      prisma.travelRequest.count({ where: { status: "PENDING" } }),
      prisma.travelRequest.count({ where: { status: "APPROVED" } }),
      prisma.travelRequest.count({ where: { status: "REJECTED" } }),
      prisma.travelRequest.count({ where: { status: "CANCELLED" } }),
      prisma.travelRequest.count({ where: { status: "BOOKED" } }),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { fare: true },
      }),
    ]);

    const totalTravelSpend = Number(fareAggregate._sum.fare ?? 0);

    // Rate calculations based on non-cancelled requests
    const nonCancelled = totalTravelRequests - cancelledRequests;
    const approvalRate =
      nonCancelled > 0
        ? Number(
            (((approvedRequests + bookedRequests) / nonCancelled) * 100).toFixed(
              2
            )
          )
        : 0;

    const rejectionRate =
      nonCancelled > 0
        ? Number(((rejectedRequests / nonCancelled) * 100).toFixed(2))
        : 0;

    return {
      totalTravelRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      cancelledRequests,
      bookedRequests,
      totalBookings,
      totalTravelSpend,
      approvalRate,
      rejectionRate,
    };
  }

  // ─── 2. Monthly Analytics ───────────────────────────────────────────────────

  public async getMonthlyAnalytics(
    year: number
  ): Promise<MonthlyAnalyticsItem[]> {
    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // Fetch requests and bookings in the requested year
    const [requests, bookings] = await Promise.all([
      prisma.travelRequest.findMany({
        where: {
          createdAt: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        select: {
          createdAt: true,
          fare: true,
        },
      }),
    ]);

    // Initialize full 12 months with zero counts
    const monthlyData: MonthlyAnalyticsItem[] = MONTH_NAMES.map(
      (monthName, idx) => ({
        month: monthName,
        monthIndex: idx + 1,
        year,
        requestCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        cancelledCount: 0,
        bookedCount: 0,
        bookingCount: 0,
        travelSpend: 0,
      })
    );

    // Aggregate requests by month
    for (const req of requests) {
      const monthIdx = req.createdAt.getUTCMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        const item = monthlyData[monthIdx]!;
        item.requestCount++;
        if (req.status === "APPROVED") item.approvedCount++;
        else if (req.status === "REJECTED") item.rejectedCount++;
        else if (req.status === "CANCELLED") item.cancelledCount++;
        else if (req.status === "BOOKED") item.bookedCount++;
      }
    }

    // Aggregate bookings by month
    for (const bk of bookings) {
      const monthIdx = bk.createdAt.getUTCMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        const item = monthlyData[monthIdx]!;
        item.bookingCount++;
        item.travelSpend = Number(
          (item.travelSpend + Number(bk.fare)).toFixed(2)
        );
      }
    }

    return monthlyData;
  }

  // ─── 3. Department Analytics ────────────────────────────────────────────────

  public async getDepartmentAnalytics(): Promise<DepartmentAnalyticsItem[]> {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        employees: {
          select: {
            travelRequests: {
              select: {
                status: true,
                booking: {
                  select: { fare: true },
                },
              },
            },
          },
        },
      },
    });

    const result: DepartmentAnalyticsItem[] = departments.map((dept) => {
      let totalRequests = 0;
      let approvedRequests = 0;
      let rejectedRequests = 0;
      let cancelledRequests = 0;
      let bookedRequests = 0;
      let totalBookings = 0;
      let totalSpend = 0;

      for (const emp of dept.employees) {
        for (const req of emp.travelRequests) {
          totalRequests++;
          if (req.status === "APPROVED") approvedRequests++;
          else if (req.status === "REJECTED") rejectedRequests++;
          else if (req.status === "CANCELLED") cancelledRequests++;
          else if (req.status === "BOOKED") {
            bookedRequests++;
          }

          if (req.booking) {
            totalBookings++;
            totalSpend += Number(req.booking.fare);
          }
        }
      }

      const nonCancelled = totalRequests - cancelledRequests;
      const approvalRate =
        nonCancelled > 0
          ? Number(
              (
                ((approvedRequests + bookedRequests) / nonCancelled) *
                100
              ).toFixed(2)
            )
          : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalRequests,
        approvedRequests,
        rejectedRequests,
        bookedRequests,
        totalBookings,
        totalSpend: Number(totalSpend.toFixed(2)),
        approvalRate,
      };
    });

    // Sort by totalRequests descending
    result.sort((a, b) => b.totalRequests - a.totalRequests);

    return result;
  }

  // ─── 4. Vendor Analytics ────────────────────────────────────────────────────

  public async getVendorAnalytics(): Promise<VendorAnalyticsItem[]> {
    const vendorAggregates = await prisma.booking.groupBy({
      by: ["vendor"],
      _count: { id: true },
      _sum: { fare: true },
      _avg: { fare: true },
      orderBy: {
        _count: { id: "desc" },
      },
    });

    return vendorAggregates.map((v) => ({
      vendor: v.vendor,
      bookingCount: v._count.id,
      totalSpend: Number(v._sum.fare ?? 0),
      averageFare: Number((v._avg.fare ?? 0).toFixed(2)),
    }));
  }

  // ─── 5. Travel Requests Report ──────────────────────────────────────────────

  public async getTravelRequestsReport(
    filters: TravelRequestReportFilters
  ): Promise<PaginatedReport<unknown>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TravelRequestWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.departmentId) {
      where.employee = { departmentId: filters.departmentId };
    }
    if (filters.fromDate ?? filters.toDate) {
      where.departureDate = {};
      if (filters.fromDate) where.departureDate.gte = filters.fromDate;
      if (filters.toDate) {
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.departureDate.lte = endOfDay;
      }
    }

    const [data, total] = await prisma.$transaction([
      prisma.travelRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, name: true } },
              branch: { select: { id: true, name: true, city: true } },
            },
          },
          approvedBy: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
            },
          },
          booking: {
            select: {
              id: true,
              airline: true,
              flightNumber: true,
              pnr: true,
              fare: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.travelRequest.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── 6. Bookings Report ─────────────────────────────────────────────────────

  public async getBookingsReport(
    filters: BookingReportFilters
  ): Promise<PaginatedReport<unknown>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    if (filters.vendor) {
      where.vendor = filters.vendor;
    }
    if (filters.employeeId) {
      where.travelRequest = { employeeId: filters.employeeId };
    }
    if (filters.departmentId) {
      where.travelRequest = {
        employee: { departmentId: filters.departmentId },
      };
    }
    if (filters.fromDate ?? filters.toDate) {
      where.departureDatetime = {};
      if (filters.fromDate) where.departureDatetime.gte = filters.fromDate;
      if (filters.toDate) {
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.departureDatetime.lte = endOfDay;
      }
    }

    const [data, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: {
          travelRequest: {
            include: {
              employee: {
                select: {
                  id: true,
                  employeeId: true,
                  firstName: true,
                  lastName: true,
                  department: { select: { id: true, name: true } },
                  designation: { select: { id: true, name: true } },
                  branch: { select: { id: true, name: true, city: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── 7. Export Travel Requests to Excel ──────────────────────────────────────

  public async exportTravelRequestsExcel(
    filters: Omit<TravelRequestReportFilters, "page" | "limit">
  ): Promise<Buffer> {
    const where: Prisma.TravelRequestWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) {
      where.employee = { departmentId: filters.departmentId };
    }
    if (filters.fromDate ?? filters.toDate) {
      where.departureDate = {};
      if (filters.fromDate) where.departureDate.gte = filters.fromDate;
      if (filters.toDate) {
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.departureDate.lte = endOfDay;
      }
    }

    const requests = await prisma.travelRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
            department: { select: { name: true } },
            designation: { select: { name: true } },
            branch: { select: { name: true } },
          },
        },
        approvedBy: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ETMS";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Travel Requests", {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    // Title Row
    worksheet.mergeCells("A1:R1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `ETMS — Travel Requests Report (Generated: ${new Date().toISOString()})`;
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 30;

    // Blank row 2
    worksheet.getRow(2).height = 10;

    // Headers Row 3
    const headers = [
      "Request ID",
      "Employee ID",
      "Employee Name",
      "Email",
      "Department",
      "Designation",
      "Branch",
      "Origin",
      "Destination",
      "Trip Type",
      "Departure Date",
      "Return Date",
      "Purpose",
      "Status",
      "Approver",
      "Approval Date",
      "Created At",
      "Updated At",
    ];

    const headerRow = worksheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "medium", color: { argb: "FF64748B" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    // Populate Data
    for (const req of requests) {
      const row = worksheet.addRow([
        req.id,
        req.employee.employeeId,
        `${req.employee.firstName} ${req.employee.lastName}`,
        req.employee.user.email,
        req.employee.department.name,
        req.employee.designation.name,
        req.employee.branch.name,
        req.origin,
        req.destination,
        req.tripType,
        req.departureDate.toISOString().split("T")[0],
        req.returnDate ? req.returnDate.toISOString().split("T")[0] : "N/A",
        req.purpose,
        req.status,
        req.approvedBy
          ? `${req.approvedBy.firstName} ${req.approvedBy.lastName} (${req.approvedBy.employeeId})`
          : "N/A",
        req.approvalDate ? req.approvalDate.toISOString() : "N/A",
        req.createdAt.toISOString(),
        req.updatedAt.toISOString(),
      ]);

      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10 };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    }

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const str = cell.value ? String(cell.value) : "";
        if (str.length > maxLength) maxLength = str.length;
      });
      column.width = Math.min(maxLength + 4, 35);
    });

    worksheet.autoFilter = "A3:R3";

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── 8. Export Bookings to Excel ─────────────────────────────────────────────

  public async exportBookingsExcel(
    filters: Omit<BookingReportFilters, "page" | "limit">
  ): Promise<Buffer> {
    const where: Prisma.BookingWhereInput = {};

    if (filters.vendor) where.vendor = filters.vendor;
    if (filters.employeeId) {
      where.travelRequest = { employeeId: filters.employeeId };
    }
    if (filters.departmentId) {
      where.travelRequest = {
        employee: { departmentId: filters.departmentId },
      };
    }
    if (filters.fromDate ?? filters.toDate) {
      where.departureDatetime = {};
      if (filters.fromDate) where.departureDatetime.gte = filters.fromDate;
      if (filters.toDate) {
        const endOfDay = new Date(filters.toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.departureDatetime.lte = endOfDay;
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        travelRequest: {
          include: {
            employee: {
              select: {
                employeeId: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ETMS";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Flight Bookings", {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    // Title Row
    worksheet.mergeCells("A1:U1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `ETMS — Flight Bookings Report (Generated: ${new Date().toISOString()})`;
    titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 30;

    // Blank row 2
    worksheet.getRow(2).height = 10;

    // Headers Row 3
    const headers = [
      "Booking ID",
      "Request ID",
      "Employee ID",
      "Employee Name",
      "Department",
      "Airline",
      "Flight Number",
      "PNR",
      "Ticket Number",
      "Departure Airport",
      "Arrival Airport",
      "Departure DateTime",
      "Arrival DateTime",
      "Fare",
      "Currency",
      "Seat",
      "Baggage",
      "Vendor",
      "Booking Source",
      "Booking Date",
      "Ticket Available",
    ];

    const headerRow = worksheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "medium", color: { argb: "FF64748B" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    // Populate Data
    for (const bk of bookings) {
      const row = worksheet.addRow([
        bk.id,
        bk.travelRequestId,
        bk.travelRequest.employee.employeeId,
        `${bk.travelRequest.employee.firstName} ${bk.travelRequest.employee.lastName}`,
        bk.travelRequest.employee.department.name,
        bk.airline,
        bk.flightNumber,
        bk.pnr,
        bk.ticketNumber,
        bk.departureAirport,
        bk.arrivalAirport,
        bk.departureDatetime.toISOString(),
        bk.arrivalDatetime.toISOString(),
        Number(bk.fare),
        bk.currency,
        bk.seat ?? "N/A",
        bk.baggage ?? "N/A",
        bk.vendor,
        bk.bookingSource ?? "Corporate Desk",
        bk.bookingDate.toISOString(),
        bk.ticketFilePath ? "YES" : "NO",
      ]);

      row.eachCell((cell, colNum) => {
        cell.font = { name: "Arial", size: 10 };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        // Format Fare column (col 14) as currency number
        if (colNum === 14) {
          cell.numFmt = "#,##0.00";
        }
      });
    }

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const str = cell.value ? String(cell.value) : "";
        if (str.length > maxLength) maxLength = str.length;
      });
      column.width = Math.min(maxLength + 4, 35);
    });

    worksheet.autoFilter = "A3:U3";

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const reportsService = new ReportsService();
