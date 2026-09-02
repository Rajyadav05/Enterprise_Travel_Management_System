import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  UserCheck,
  XCircle,
} from "lucide-react";
import { bookingApi } from "../../api/booking.api";
import { travelApi } from "../../api/travel.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import type { Booking, TravelRequest } from "../../types";

export const EmployeeRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const reqData = await travelApi.getRequestById(id);
      setRequest(reqData);

      if (reqData.status === "BOOKED") {
        try {
          const bkData = await bookingApi.getBookingForRequest(id);
          setBooking(bkData);
        } catch {
          // Booking might be loading or separate
        }
      }
    } catch (err: unknown) {
      toastError(
        "Error",
        (err instanceof Error ? err.message : undefined) ||
          "Failed to load travel request details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const handleCancelRequest = async () => {
    if (!id) return;
    setIsCancelling(true);
    try {
      await travelApi.cancelRequest(id);
      success("Request Cancelled", "Your travel request has been cancelled.");
      setIsCancelModalOpen(false);
      void loadData();
    } catch (err: unknown) {
      toastError(
        "Failed to Cancel",
        (err instanceof Error ? err.message : undefined) ||
          "Unable to cancel request."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!booking) return;
    setIsDownloading(true);
    try {
      await bookingApi.downloadTicket(booking.id, `Ticket_${booking.pnr}.pdf`);
      success("Ticket Downloaded", "E-Ticket downloaded successfully.");
    } catch (err: unknown) {
      toastError(
        "Download Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Could not download ticket file."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The requested travel itinerary does not exist or has been removed.
        </p>
        <Button
          variant="primary"
          className="mt-6"
          onClick={() => navigate("/employee/requests")}
        >
          Back to My Requests
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/employee/requests")}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {request.origin} → {request.destination}
              </h1>
              <Badge status={request.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Request ID: {request.id} • Submitted on{" "}
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {request.status === "PENDING" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
            >
              Cancel Request
            </Button>
          )}

          {request.status === "BOOKED" && booking?.ticketFilePath && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isDownloading}
              onClick={handleDownloadTicket}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download E-Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Flight Booking Banner if BOOKED */}
      {request.status === "BOOKED" && booking && (
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 shadow-hover overflow-hidden relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold">
                  CONFIRMED FLIGHT
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  PNR: <strong className="text-white">{booking.pnr}</strong>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {booking.airline} • Flight {booking.flightNumber}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Ticket #: {booking.ticketNumber} • Seat: {booking.seat || "Assigned at check-in"} • Baggage: {booking.baggage || "Standard"}
                </p>
              </div>

              <div className="flex items-center gap-6 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Departure</span>
                  <span className="font-semibold text-white">
                    {booking.departureAirport} ({new Date(booking.departureDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                  <span className="text-slate-400 block text-[11px]">
                    {new Date(booking.departureDatetime).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-slate-500">→</div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Arrival</span>
                  <span className="font-semibold text-white">
                    {booking.arrivalAirport} ({new Date(booking.arrivalDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                  <span className="text-slate-400 block text-[11px]">
                    {new Date(booking.arrivalDatetime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {booking.ticketFilePath ? (
              <Button
                variant="primary"
                size="md"
                className="bg-brand-500 hover:bg-brand-600 text-white shrink-0"
                isLoading={isDownloading}
                onClick={handleDownloadTicket}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download PDF E-Ticket
              </Button>
            ) : (
              <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                Ticket file pending upload by Travel Desk
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Itinerary Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Trip Details */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Trip Overview" padding="md">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">
                  Origin (From)
                </dt>
                <dd className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  {request.origin}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">
                  Destination (To)
                </dt>
                <dd className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  {request.destination}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">
                  Departure Date
                </dt>
                <dd className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(request.departureDate).toLocaleDateString()}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase">
                  Return Date
                </dt>
                <dd className="text-sm font-medium text-slate-900 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {request.returnDate
                    ? new Date(request.returnDate).toLocaleDateString()
                    : "One Way Trip"}
                </dd>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <dt className="text-xs font-semibold text-slate-400 uppercase">
                  Business Purpose
                </dt>
                <dd className="text-sm text-slate-800 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {request.purpose}
                </dd>
              </div>

              {request.additionalInfo && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-slate-400 uppercase">
                    Additional Preferences & Notes
                  </dt>
                  <dd className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {request.additionalInfo}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* Right 1 Col: Status & Approval Information */}
        <div className="space-y-6">
          <Card title="Workflow Status" padding="md">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                    request.status === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : request.status === "APPROVED" || request.status === "BOOKED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status === "PENDING" && <Clock className="w-4 h-4" />}
                  {(request.status === "APPROVED" || request.status === "BOOKED") && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {(request.status === "REJECTED" || request.status === "CANCELLED") && (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {request.status.replace(/_/g, " ")}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Current Workflow Stage
                  </p>
                </div>
              </div>

              {request.approvedBy && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Reviewed by:</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {request.approvedBy.firstName} {request.approvedBy.lastName} (
                    {request.approvedBy.employeeId})
                  </p>
                  {request.approvalDate && (
                    <p className="text-xs text-slate-500">
                      Date: {new Date(request.approvalDate).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {request.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                  <span className="font-semibold block">Rejection Reason:</span>
                  <p>{request.rejectionReason}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Travel Request"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Keep Request
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelRequest}
              isLoading={isCancelling}
            >
              Yes, Cancel Request
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p>
            Are you sure you want to cancel your travel request for{" "}
            <strong>
              {request.origin} → {request.destination}
            </strong>
            ? Your request will be marked as CANCELLED.
          </p>
        </div>
      </Modal>
    </div>
  );
};
