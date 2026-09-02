import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Plane,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { bookingApi, type CreateBookingPayload } from "../../api/booking.api";
import { travelApi } from "../../api/travel.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import type { Booking, BookingVendor, TravelRequest } from "../../types";

const VENDOR_OPTIONS: Array<{ value: BookingVendor; label: string }> = [
  { value: "MAKEMYTRIP", label: "MakeMyTrip" },
  { value: "CLEARTRIP", label: "Cleartrip" },
  { value: "AIRLINE_WEBSITE", label: "Airline Direct Website" },
  { value: "CORPORATE_TRAVEL_AGENT", label: "Corporate Travel Agent" },
  { value: "TRAVEL_AGENT", label: "Local Travel Agent" },
  { value: "KNOWN_PERSON", label: "Known Person / Desk" },
  { value: "OTHER", label: "Other Vendor" },
];

export const AdminRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Approve & Reject State
  const [isApproving, setIsApproving] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Booking Form State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState<CreateBookingPayload>({
    airline: "",
    flightNumber: "",
    pnr: "",
    ticketNumber: "",
    departureAirport: "",
    arrivalAirport: "",
    departureDatetime: "",
    arrivalDatetime: "",
    fare: 0,
    currency: "INR",
    seat: "",
    baggage: "15 KG",
    vendor: "MAKEMYTRIP",
    bookingSource: "Corporate Travel Portal",
  });

  // Ticket Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [isUploadingTicket, setIsUploadingTicket] = useState(false);
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const reqData = await travelApi.adminGetRequestById(id);
      setRequest(reqData);

      if (reqData.status === "BOOKED" && reqData.booking) {
        setBooking(reqData.booking);
      }
    } catch (err: unknown) {
      toastError(
        "Error",
        (err instanceof Error ? err.message : undefined) ||
          "Failed to load request."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setIsApproving(true);
    try {
      const updated = await travelApi.adminApproveRequest(id);
      success(
        "Request Approved!",
        `Travel request #${updated.id.substring(0, 8)} is approved. You can now issue flight bookings.`
      );
      void loadData();
    } catch (err: unknown) {
      toastError(
        "Approval Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Could not approve request."
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      toastError("Rejection Reason Required", "Please provide a reason for rejecting this travel request.");
      return;
    }
    setIsRejecting(true);
    try {
      await travelApi.adminRejectRequest(id, rejectionReason.trim());
      success("Request Rejected", "Travel request has been rejected.");
      setIsRejectModalOpen(false);
      void loadData();
    } catch (err: unknown) {
      toastError(
        "Rejection Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Could not reject request."
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (
      !bookingForm.airline ||
      !bookingForm.flightNumber ||
      !bookingForm.pnr ||
      !bookingForm.ticketNumber ||
      !bookingForm.departureAirport ||
      !bookingForm.arrivalAirport ||
      !bookingForm.departureDatetime ||
      !bookingForm.arrivalDatetime ||
      bookingForm.fare <= 0
    ) {
      toastError("Missing Fields", "Please complete all mandatory booking details.");
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const newBooking = await bookingApi.adminCreateBooking(id, {
        ...bookingForm,
        fare: Number(bookingForm.fare),
      });

      success(
        "Flight Booked Successfully!",
        `Booking issued with PNR: ${newBooking.pnr}. Request status is updated to BOOKED.`
      );
      setIsBookingModalOpen(false);
      void loadData();
    } catch (err: unknown) {
      toastError(
        "Booking Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Could not record flight booking."
      );
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleUploadTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !ticketFile) {
      toastError("File Required", "Please select a ticket file (PDF, PNG, JPEG).");
      return;
    }

    setIsUploadingTicket(true);
    try {
      await bookingApi.adminUploadTicket(booking.id, ticketFile);
      success("Ticket Uploaded", "E-Ticket file has been attached to this booking.");
      setIsUploadModalOpen(false);
      setTicketFile(null);
      void loadData();
    } catch (err: unknown) {
      toastError(
        "Upload Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Could not upload ticket file."
      );
    } finally {
      setIsUploadingTicket(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!booking) return;
    setIsDownloadingTicket(true);
    try {
      await bookingApi.downloadTicket(booking.id, `Ticket_${booking.pnr}.pdf`);
      success("Ticket Downloaded", "E-Ticket downloaded successfully.");
    } catch (err: unknown) {
      toastError(
        "Download Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Failed to download ticket file."
      );
    } finally {
      setIsDownloadingTicket(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <Button
          variant="primary"
          className="mt-6"
          onClick={() => navigate("/admin/requests")}
        >
          Back to Request Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/requests")}
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
              Request ID: {request.id} • Submitted:{" "}
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {request.status === "PENDING" && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsRejectModalOpen(true)}
                leftIcon={<X className="w-4 h-4" />}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isApproving}
                onClick={handleApprove}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Approve Request
              </Button>
            </>
          )}

          {request.status === "APPROVED" && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setBookingForm((prev) => ({
                  ...prev,
                  departureAirport: request.origin,
                  arrivalAirport: request.destination,
                  departureDatetime: `${request.departureDate.split("T")[0]}T09:00`,
                  arrivalDatetime: `${request.departureDate.split("T")[0]}T12:00`,
                }));
                setIsBookingModalOpen(true);
              }}
              leftIcon={<Plane className="w-4 h-4" />}
            >
              Issue Flight Booking
            </Button>
          )}

          {request.status === "BOOKED" && booking && (
            <>
              {!booking.ticketFilePath && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload Ticket File
                </Button>
              )}
              {booking.ticketFilePath && (
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isDownloadingTicket}
                  onClick={handleDownloadTicket}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download E-Ticket
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmed Booking Banner if BOOKED */}
      {request.status === "BOOKED" && booking && (
        <Card className="bg-[#0F172A] text-white border-slate-700 shadow-hover p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold">
                  FLIGHT ISSUED (BOOKED)
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  PNR: <strong className="text-white">{booking.pnr}</strong>
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {booking.airline} • {booking.flightNumber} ({booking.departureAirport} → {booking.arrivalAirport})
              </h3>
              <p className="text-xs text-slate-300">
                Ticket: {booking.ticketNumber} • Fare: {booking.currency} {Number(booking.fare).toLocaleString()} • Vendor: {booking.vendor}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!booking.ticketFilePath ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Upload E-Ticket PDF
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isDownloadingTicket}
                  onClick={handleDownloadTicket}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download PDF
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Details 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Employee & Trip Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Card */}
          <Card title="Applicant Employee Details" padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Employee Name
                </span>
                <p className="font-bold text-slate-900 mt-1">
                  {request.employee?.firstName} {request.employee?.lastName}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Employee ID
                </span>
                <p className="font-mono text-slate-900 mt-1">
                  {request.employee?.employeeId}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Department
                </span>
                <p className="text-slate-800 mt-1">
                  {request.employee?.department?.name || "—"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Designation / Role
                </span>
                <p className="text-slate-800 mt-1">
                  {request.employee?.designation?.name || "—"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Office Branch
                </span>
                <p className="text-slate-800 mt-1">
                  {request.employee?.branch?.name} ({request.employee?.branch?.city})
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Contact Email
                </span>
                <p className="text-slate-800 mt-1 font-mono text-xs">
                  {request.employee?.user?.email}
                </p>
              </div>
            </div>
          </Card>

          {/* Travel Itinerary Card */}
          <Card title="Itinerary & Purpose" padding="md">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Departure Date
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {new Date(request.departureDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Return Date
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {request.returnDate
                      ? new Date(request.returnDate).toLocaleDateString()
                      : "One Way Trip"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Business Purpose
                </span>
                <p className="text-slate-800 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {request.purpose}
                </p>
              </div>

              {request.additionalInfo && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Additional Notes & Preferences
                  </span>
                  <p className="text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {request.additionalInfo}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Status & Actions */}
        <div className="space-y-6">
          <Card title="Workflow & Review" padding="md">
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
                  <p className="text-xs text-slate-500">Current Stage</p>
                </div>
              </div>

              {request.approvedBy && (
                <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                  <span className="text-slate-400 block font-semibold uppercase">
                    Admin Reviewer
                  </span>
                  <p className="text-slate-900 font-semibold">
                    {request.approvedBy.firstName} {request.approvedBy.lastName} ({request.approvedBy.employeeId})
                  </p>
                  {request.approvalDate && (
                    <p className="text-slate-500 font-mono text-[11px]">
                      {new Date(request.approvalDate).toLocaleString()}
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

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Travel Request"
        subtitle="Please specify why this corporate travel application is rejected."
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              isLoading={isRejecting}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Budget ceiling reached for Q3, or event can be attended virtually..."
            required
            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
      </Modal>

      {/* Issue Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Issue Flight Booking & Reservation"
        subtitle="Enter airline, PNR, flight timings, and ticket details."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsBookingModalOpen(false)}
              disabled={isSubmittingBooking}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBooking}
              isLoading={isSubmittingBooking}
              leftIcon={<Plane className="w-4 h-4" />}
            >
              Confirm & Book Flight
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Airline"
              placeholder="e.g. Emirates / IndiGo / Air India"
              value={bookingForm.airline}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, airline: e.target.value })
              }
              required
            />
            <Input
              label="Flight Number"
              placeholder="e.g. EK501 / 6E204"
              value={bookingForm.flightNumber}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, flightNumber: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="PNR / Booking Reference"
              placeholder="e.g. PNR88219"
              value={bookingForm.pnr}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, pnr: e.target.value })
              }
              required
            />
            <Input
              label="Ticket Number (13-Digit / E-Ticket)"
              placeholder="e.g. 1769876543210"
              value={bookingForm.ticketNumber}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, ticketNumber: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Departure Airport (IATA)"
              placeholder="e.g. BOM"
              value={bookingForm.departureAirport}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  departureAirport: e.target.value,
                })
              }
              required
            />
            <Input
              label="Arrival Airport (IATA)"
              placeholder="e.g. DXB"
              value={bookingForm.arrivalAirport}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  arrivalAirport: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Departure DateTime"
              value={bookingForm.departureDatetime}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  departureDatetime: e.target.value,
                })
              }
              required
            />
            <Input
              type="datetime-local"
              label="Arrival DateTime"
              value={bookingForm.arrivalDatetime}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  arrivalDatetime: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Total Fare"
              placeholder="25000"
              value={bookingForm.fare || ""}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  fare: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
            <Input
              label="Currency (ISO)"
              value={bookingForm.currency}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, currency: e.target.value })
              }
              required
            />
            <Select
              label="Booking Vendor"
              options={VENDOR_OPTIONS}
              value={bookingForm.vendor}
              onChange={(e) =>
                setBookingForm({
                  ...bookingForm,
                  vendor: e.target.value as BookingVendor,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Seat (Optional)"
              placeholder="e.g. 14A"
              value={bookingForm.seat || ""}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, seat: e.target.value })
              }
            />
            <Input
              label="Baggage (Optional)"
              placeholder="e.g. 25 KG"
              value={bookingForm.baggage || ""}
              onChange={(e) =>
                setBookingForm({ ...bookingForm, baggage: e.target.value })
              }
            />
          </div>
        </form>
      </Modal>

      {/* Upload Ticket Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload E-Ticket Document"
        subtitle="Attach PDF, PNG, or JPEG file (max 5 MB)."
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploadingTicket}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadTicket}
              isLoading={isUploadingTicket}
              disabled={!ticketFile}
            >
              Upload Ticket
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-brand-500 transition-colors">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              id="ticket_upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setTicketFile(e.target.files[0]);
                }
              }}
            />
            <label
              htmlFor="ticket_upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-brand-600" />
              <span className="text-sm font-semibold text-slate-900">
                {ticketFile ? ticketFile.name : "Click to select ticket file"}
              </span>
              <span className="text-xs text-slate-500">
                {ticketFile
                  ? `${(ticketFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : "PDF, JPEG, or PNG up to 5 MB"}
              </span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};
