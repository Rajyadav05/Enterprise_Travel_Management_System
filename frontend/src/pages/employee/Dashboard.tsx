import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Plane,
  PlusCircle,
  Ticket,
} from "lucide-react";
import { travelApi } from "../../api/travel.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import type { TravelRequest } from "../../types";

export const EmployeeDashboard: React.FC = () => {
  const { employee, user } = useAuth();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await travelApi.getMyRequests({ limit: 10 });
        setRequests(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load employee requests", err);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const bookedCount = requests.filter((r) => r.status === "BOOKED").length;

  const upcomingTrip = requests.find(
    (r) =>
      (r.status === "APPROVED" || r.status === "BOOKED") &&
      new Date(r.departureDate) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {employee?.firstName || user?.email.split("@")[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your corporate travel requests and flight itineraries.
          </p>
        </div>

        <Link to="/employee/requests/new">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Travel Request
          </Button>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Requests
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalCount}
                </p>
              )}
            </div>
            <div className="w-11 h-11 rounded-card bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plane className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Pending Review */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pending Approval
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {pendingCount}
                </p>
              )}
            </div>
            <div className="w-11 h-11 rounded-card bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Approved Requests */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Approved
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {approvedCount}
                </p>
              )}
            </div>
            <div className="w-11 h-11 rounded-card bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Booked / Completed */}
        <Card padding="sm" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Booked Trips
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {bookedCount}
                </p>
              )}
            </div>
            <div className="w-11 h-11 rounded-card bg-purple-50 text-purple-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Trip Hero Card */}
      {upcomingTrip && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-modal p-6 text-white shadow-hover border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-brand-500/20 text-brand-300 border border-brand-400/40 text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold">
                UPCOMING TRAVEL
              </span>
              <Badge status={upcomingTrip.status} size="sm" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>{upcomingTrip.origin}</span>
              <ArrowRight className="w-5 h-5 text-brand-400 shrink-0" />
              <span>{upcomingTrip.destination}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Departure: {new Date(upcomingTrip.departureDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Purpose: {upcomingTrip.purpose}
              </span>
            </div>
          </div>

          <Link to={`/employee/requests/${upcomingTrip.id}`}>
            <Button
              variant="primary"
              size="md"
              className="bg-brand-500 hover:bg-brand-600 text-white whitespace-nowrap"
            >
              {upcomingTrip.status === "BOOKED" ? "View E-Ticket" : "View Trip Details"}
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Travel Requests Section */}
      <Card
        title="Recent Travel Requests"
        subtitle="Your latest corporate travel applications and current progress."
        headerAction={
          <Link
            to="/employee/requests"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All Requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        padding="none"
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Plane className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">
              No Travel Requests Yet
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              You haven't submitted any corporate travel requests. Create your
              first trip request to get started.
            </p>
            <Link to="/employee/requests/new" className="mt-4">
              <Button variant="primary" size="sm">
                Submit Request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Route</th>
                  <th className="py-3 px-6">Trip Type</th>
                  <th className="py-3 px-6">Departure Date</th>
                  <th className="py-3 px-6">Purpose</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.slice(0, 5).map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {req.origin} → {req.destination}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {req.tripType.replace(/_/g, " ")}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {new Date(req.departureDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                      {req.purpose}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/employee/requests/${req.id}`}>
                        <Button variant="secondary" size="sm">
                          Details
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
