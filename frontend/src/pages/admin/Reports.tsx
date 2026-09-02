import React, { useEffect, useState } from "react";
import {
  Building2,
  DollarSign,
  FileSpreadsheet,
  Plane,
  TrendingUp,
} from "lucide-react";
import { reportsApi, type ReportQueryParams } from "../../api/reports.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import type {
  Booking,
  DepartmentAnalyticsItem,
  TravelRequest,
  VendorAnalyticsItem,
} from "../../types";

export const AdminReports: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<
    "REQUESTS" | "BOOKINGS" | "DEPARTMENTS" | "VENDORS"
  >("REQUESTS");

  // Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");

  // Data states
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [departments, setDepartments] = useState<DepartmentAnalyticsItem[]>([]);
  const [vendors, setVendors] = useState<VendorAnalyticsItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadReportData = async () => {
    setIsLoading(true);
    const filterParams: ReportQueryParams = {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      status: statusFilter || undefined,
      vendor: vendorFilter || undefined,
      limit: 100,
    };

    try {
      if (activeTab === "REQUESTS") {
        const res = await reportsApi.getTravelRequestsReport(filterParams);
        setRequests(res.data);
      } else if (activeTab === "BOOKINGS") {
        const res = await reportsApi.getBookingsReport(filterParams);
        setBookings(res.data);
      } else if (activeTab === "DEPARTMENTS") {
        const res = await reportsApi.getDepartments();
        setDepartments(res);
      } else if (activeTab === "VENDORS") {
        const res = await reportsApi.getVendors();
        setVendors(res);
      }
    } catch (err: unknown) {
      toastError(
        "Report Error",
        (err instanceof Error ? err.message : undefined) ||
          "Failed to fetch report data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReportData();
  }, [activeTab, fromDate, toDate, statusFilter, vendorFilter]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filterParams: ReportQueryParams = {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: statusFilter || undefined,
        vendor: vendorFilter || undefined,
      };

      if (activeTab === "BOOKINGS") {
        await reportsApi.exportBookings(filterParams);
        success("Excel Generated", "Bookings report downloaded successfully.");
      } else {
        await reportsApi.exportTravelRequests(filterParams);
        success("Excel Generated", "Travel Requests report downloaded successfully.");
      }
    } catch (err: unknown) {
      toastError(
        "Export Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Could not generate Excel spreadsheet."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise travel volume, department expenditures, vendor metrics, and formatted Excel exports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(activeTab === "REQUESTS" || activeTab === "BOOKINGS") && (
            <Button
              variant="primary"
              size="md"
              isLoading={isExporting}
              onClick={handleExport}
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Export Excel (.xlsx)
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("REQUESTS")}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "REQUESTS"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Plane className="w-4 h-4" /> Travel Requests Report
        </button>

        <button
          onClick={() => setActiveTab("BOOKINGS")}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "BOOKINGS"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Flight Bookings Report
        </button>

        <button
          onClick={() => setActiveTab("DEPARTMENTS")}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "DEPARTMENTS"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" /> Department Analytics
        </button>

        <button
          onClick={() => setActiveTab("VENDORS")}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "VENDORS"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Vendor Spend Breakdown
        </button>
      </div>

      {/* Date & Filter Control Bar */}
      {(activeTab === "REQUESTS" || activeTab === "BOOKINGS") && (
        <Card padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">
                From:
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">
                To:
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            {activeTab === "REQUESTS" && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="BOOKED">BOOKED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            )}

            {activeTab === "BOOKINGS" && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">
                  Vendor:
                </label>
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white cursor-pointer"
                >
                  <option value="">All Vendors</option>
                  <option value="MAKEMYTRIP">MakeMyTrip</option>
                  <option value="CLEARTRIP">Cleartrip</option>
                  <option value="AIRLINE_WEBSITE">Airline Direct</option>
                  <option value="CORPORATE_TRAVEL_AGENT">Corporate Agent</option>
                  <option value="TRAVEL_AGENT">Travel Agent</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            )}

            {(fromDate || toDate || statusFilter || vendorFilter) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setStatusFilter("");
                  setVendorFilter("");
                }}
                className="text-xs text-brand-600 font-semibold hover:underline ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Content Area */}
      <Card padding="none">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : activeTab === "REQUESTS" ? (
          /* Travel Requests Table */
          requests.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No travel requests match the selected report filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-6">Department</th>
                    <th className="py-3 px-6">Route</th>
                    <th className="py-3 px-6">Departure Date</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-6 font-mono text-xs text-slate-500">
                        #{r.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900 text-xs">
                        {r.employee?.firstName} {r.employee?.lastName}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-700">
                        {r.employee?.department?.name || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-xs font-semibold text-slate-900">
                        {r.origin} → {r.destination}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-700">
                        {new Date(r.departureDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge status={r.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === "BOOKINGS" ? (
          /* Flight Bookings Table */
          bookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No flight bookings found for this report range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">PNR</th>
                    <th className="py-3 px-6">Airline / Flight</th>
                    <th className="py-3 px-6">Route</th>
                    <th className="py-3 px-6">Vendor</th>
                    <th className="py-3 px-6">Departure Time</th>
                    <th className="py-3 px-6 text-right">Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-6 font-mono font-bold text-xs text-slate-900">
                        {b.pnr}
                      </td>
                      <td className="py-3.5 px-6 text-xs font-semibold text-slate-900">
                        {b.airline} ({b.flightNumber})
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-700">
                        {b.departureAirport} → {b.arrivalAirport}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-600 font-mono">
                        {b.vendor}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-700">
                        {new Date(b.departureDatetime).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900 text-xs">
                        {b.currency} {Number(b.fare).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === "DEPARTMENTS" ? (
          /* Department Analytics Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6 text-center">Total Requests</th>
                  <th className="py-3 px-6 text-center">Approved</th>
                  <th className="py-3 px-6 text-center">Booked</th>
                  <th className="py-3 px-6 text-center">Approval Rate</th>
                  <th className="py-3 px-6 text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((d) => (
                  <tr key={d.departmentId} className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900 text-xs">
                      {d.departmentName}
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-mono">
                      {d.totalRequests}
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-mono text-emerald-600">
                      {d.approvedRequests}
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-mono text-purple-600">
                      {d.bookedRequests}
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-mono font-semibold">
                      {d.approvalRate}%
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹ {d.totalSpend.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Vendor Spend Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Booking Vendor</th>
                  <th className="py-3 px-6 text-center">Bookings Count</th>
                  <th className="py-3 px-6 text-right">Average Fare</th>
                  <th className="py-3 px-6 text-right">Gross Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.vendor} className="hover:bg-slate-50/80">
                    <td className="py-4 px-6 font-bold text-slate-900 text-xs font-mono">
                      {v.vendor}
                    </td>
                    <td className="py-4 px-6 text-center text-xs font-mono">
                      {v.bookingCount}
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-mono text-slate-700">
                      ₹ {v.averageFare.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹ {v.totalSpend.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
