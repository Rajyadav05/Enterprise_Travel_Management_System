import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Plane,
  PlusCircle,
  Search,
} from "lucide-react";
import { travelApi } from "../../api/travel.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TableSkeleton } from "../../components/ui/Skeleton";
import type { TravelRequest } from "../../types";

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Booked", value: "BOOKED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadRequests = async (status?: string) => {
    setIsLoading(true);
    try {
      const res = await travelApi.getMyRequests({
        status: status || undefined,
        limit: 50,
      });
      setRequests(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(statusFilter);
  }, [statusFilter]);

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Travel Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage all your corporate flight requests and travel history.
          </p>
        </div>

        <Link to="/employee/requests/new">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Request
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by city, purpose, or request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {STATUS_FILTERS.map((tab) => (
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
          <TableSkeleton rows={5} cols={6} />
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Plane className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              No Travel Requests Found
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || statusFilter
                ? "No travel requests match your active filter criteria."
                : "You have not submitted any travel requests yet."}
            </p>
            {statusFilter || searchQuery ? (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs font-semibold text-brand-600 hover:underline"
              >
                Clear all filters
              </button>
            ) : (
              <Link to="/employee/requests/new" className="mt-4">
                <Button variant="primary" size="sm">
                  Create First Request
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Request ID</th>
                  <th className="py-3 px-6">Route</th>
                  <th className="py-3 px-6">Trip Type</th>
                  <th className="py-3 px-6">Departure Date</th>
                  <th className="py-3 px-6">Return Date</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      #{req.id.substring(0, 8)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.origin}</span>
                        <span className="text-slate-400">→</span>
                        <span>{req.destination}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {req.tripType === "ROUND_TRIP" ? "Round Trip" : "One Way"}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {new Date(req.departureDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {req.returnDate
                        ? new Date(req.returnDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/employee/requests/${req.id}`}>
                        <Button variant="secondary" size="sm">
                          View Details
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
