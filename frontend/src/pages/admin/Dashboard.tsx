import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  FileSpreadsheet,
  Plane,
} from "lucide-react";
import { reportsApi } from "../../api/reports.api";
import { travelApi } from "../../api/travel.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import type {
  DashboardSummary,
  DepartmentAnalyticsItem,
  MonthlyAnalyticsItem,
  TravelRequest,
} from "../../types";

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalyticsItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentAnalyticsItem[]>([]);
  const [recentRequests, setRecentRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sum, mon, depts, , reqs] = await Promise.all([
          reportsApi.getSummary(),
          reportsApi.getMonthly(),
          reportsApi.getDepartments(),
          reportsApi.getVendors(),
          travelApi.adminListRequests({ limit: 5 }),
        ]);

        setSummary(sum);
        setMonthlyData(mon);
        setDepartments(depts);
        setRecentRequests(reqs.data);
      } catch (err) {
        console.error("Failed to load admin analytics", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise travel volume, approval queues, booking logistics, and expenditure metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/reports">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Export Reports
            </Button>
          </Link>
          <Link to="/admin/requests">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plane className="w-4 h-4" />}
            >
              Review Requests
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Requests */}
        <Card padding="sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Total Requests
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {summary?.totalTravelRequests ?? 0}
            </p>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">All submissions</span>
        </Card>

        {/* Pending Approval */}
        <Card padding="sm" className="border-amber-200/80 bg-amber-50/20">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide flex items-center justify-between">
            <span>Pending</span>
            <Clock className="w-3.5 h-3.5" />
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {summary?.pendingRequests ?? 0}
            </p>
          )}
          <span className="text-[11px] text-amber-700/70 mt-0.5 block">Needs review</span>
        </Card>

        {/* Approved */}
        <Card padding="sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Approved
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {summary?.approvedRequests ?? 0}
            </p>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting booking</span>
        </Card>

        {/* Booked */}
        <Card padding="sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Booked Trips
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-brand-600 mt-1">
              {summary?.bookedRequests ?? 0}
            </p>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ticket issued</span>
        </Card>

        {/* Total Spend */}
        <Card padding="sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Total Spend
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹ {(summary?.totalTravelSpend ?? 0).toLocaleString()}
            </p>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Gross ticket fares</span>
        </Card>

        {/* Approval Rate */}
        <Card padding="sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Approval Rate
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {summary?.approvalRate ?? 0}%
            </p>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">Of reviewed trips</span>
        </Card>
      </div>

      {/* Analytics Charts & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Monthly Travel Volume & Expenditure"
            subtitle="Annual distribution of requests, confirmed bookings, and expenditure."
            padding="md"
          >
            {isLoading ? (
              <div className="space-y-4 py-8">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-2 pt-4">
                  {monthlyData.map((m) => {
                    const heightPercent =
                      Math.min(
                        Math.max((m.requestCount / (summary?.totalTravelRequests || 1)) * 100, 8),
                        100
                      );

                    return (
                      <div key={m.month} className="flex flex-col items-center gap-1.5 group">
                        <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          {m.requestCount}
                        </span>
                        <div className="w-full bg-slate-100 rounded-t h-28 flex items-end justify-center p-1">
                          <div
                            className="w-full bg-brand-600 hover:bg-brand-700 rounded-t transition-all"
                            style={{ height: `${heightPercent}%` }}
                            title={`${m.month}: ${m.requestCount} requests (₹ ${m.travelSpend})`}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-medium text-slate-500 uppercase">
                          {m.month.substring(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-brand-600 rounded" />
                    <span>Monthly Request Volume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-slate-200 rounded" />
                    <span>Baseline Capacity</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Department Distribution */}
        <div className="space-y-6">
          <Card
            title="Department Spend & Volume"
            subtitle="Breakdown by corporate division."
            padding="md"
          >
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : departments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No department activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3.5">
                {departments.slice(0, 5).map((dept) => (
                  <div
                    key={dept.departmentId}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {dept.departmentName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {dept.totalRequests} Requests • {dept.totalBookings} Bookings
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-900 block">
                        ₹ {dept.totalSpend.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {dept.approvalRate}% Approved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Requests Queue Table */}
      <Card
        title="Pending & Recent Travel Requests"
        subtitle="Live request stream awaiting approval or booking execution."
        headerAction={
          <Link
            to="/admin/requests"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Go to Request Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        padding="none"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No travel requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Employee</th>
                  <th className="py-3 px-6">Route</th>
                  <th className="py-3 px-6">Departure Date</th>
                  <th className="py-3 px-6">Purpose</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-xs">
                          {req.employee?.firstName} {req.employee?.lastName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {req.employee?.employeeId} • {req.employee?.department?.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                      {req.origin} → {req.destination}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      {new Date(req.departureDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                      {req.purpose}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/admin/requests/${req.id}`}>
                        <Button
                          variant={req.status === "PENDING" ? "primary" : "secondary"}
                          size="sm"
                        >
                          {req.status === "PENDING" ? "Review" : "View"}
                        </Button>
                      </Link>
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
