import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Search,
} from "lucide-react";
import { travelApi } from "../../api/travel.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TableSkeleton } from "../../components/ui/Skeleton";
import type { TravelRequest } from "../../types";

const ADMIN_STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: "All Requests", value: "" },
  { label: "Pending Review", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Booked", value: "BOOKED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const AdminRequestsQueue: React.FC = () => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadRequests = async (status?: string, targetPage: number = 1) => {
    setIsLoading(true);
    try {
      const res = await travelApi.adminListRequests({
        status: status || undefined,
        page: targetPage,
        limit: 15,
      });
      setRequests(res.data);
      setPage(res.page);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total);
    } catch (err) {
      console.error("Failed to load admin request queue", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(statusFilter, 1);
  }, [statusFilter]);

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const empName = `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`.toLowerCase();
    return (
      empName.includes(q) ||
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      r.employee?.employeeId?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Travel Request Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review corporate travel applications, grant approvals, or issue flight reservations.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          Total Queue: <strong>{totalCount}</strong> requests
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name, employee ID, city, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {ADMIN_STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.value
                    ? "bg-slate-900 text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card padding="none">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Plane className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              No Requests in Queue
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || statusFilter
                ? "No applications match your active filter."
                : "There are currently no travel requests in this queue."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Employee</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Route</th>
                  <th className="py-3 px-6">Departure Date</th>
                  <th className="py-3 px-6">Trip Type</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
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
                          {req.employee?.employeeId}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      {req.employee?.department?.name || "—"}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                      {req.origin} → {req.destination}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700">
                      {new Date(req.departureDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {req.tripType === "ROUND_TRIP" ? "Round Trip" : "One Way"}
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
                          {req.status === "PENDING"
                            ? "Review"
                            : req.status === "APPROVED"
                            ? "Book Flight"
                            : "Details"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} items)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadRequests(statusFilter, page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadRequests(statusFilter, page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
