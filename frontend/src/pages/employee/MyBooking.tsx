import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Plane,
} from "lucide-react";
import { bookingApi } from "../../api/booking.api";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../context/ToastContext";
import type { Booking } from "../../types";

export const MyBooking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await bookingApi.getBookingForRequest(id);
        setBooking(data);
      } catch (err: unknown) {
        toastError(
          "Booking Not Found",
          (err instanceof Error ? err.message : undefined) ||
            "Could not retrieve flight booking details."
        );
      } finally {
        setIsLoading(false);
      }
    };
    void loadBooking();
  }, [id]);

  const handleDownload = async () => {
    if (!booking) return;
    setIsDownloading(true);
    try {
      await bookingApi.downloadTicket(booking.id, `ETMS_Ticket_${booking.pnr}.pdf`);
      success("Ticket Downloaded", "PDF E-Ticket has been downloaded.");
    } catch (err: unknown) {
      toastError(
        "Download Failed",
        (err instanceof Error ? err.message : undefined) ||
          "Failed to download ticket file."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-modal" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-slate-900">No Booking Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          A flight booking has not been issued for this request yet.
        </p>
        <Button
          variant="primary"
          className="mt-6"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {booking.ticketFilePath && (
          <Button
            variant="primary"
            size="sm"
            isLoading={isDownloading}
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download E-Ticket
          </Button>
        )}
      </div>

      {/* Boarding Pass Style Container */}
      <div className="bg-white rounded-modal border border-slate-200 shadow-modal overflow-hidden">
        {/* Pass Header */}
        <div className="bg-[#0F172A] text-white p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {booking.airline}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Flight {booking.flightNumber}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
              Booking Ref (PNR)
            </span>
            <span className="text-xl font-bold text-white font-mono tracking-widest">
              {booking.pnr}
            </span>
          </div>
        </div>

        {/* Pass Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Flight Path */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-8">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Departure
              </span>
              <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">
                {booking.departureAirport}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(booking.departureDatetime).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col items-center px-4">
              <Plane className="w-6 h-6 text-brand-600 rotate-90 my-1" />
              <span className="text-[11px] text-slate-400 font-mono">
                Non-stop
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Arrival
              </span>
              <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">
                {booking.arrivalAirport}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(booking.arrivalDatetime).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Ticket Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Passenger
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                {booking.travelRequest?.employee?.firstName}{" "}
                {booking.travelRequest?.employee?.lastName}
              </p>
              <span className="text-xs text-slate-400 font-mono">
                {booking.travelRequest?.employee?.employeeId}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Seat
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                {booking.seat || "Unassigned"}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Baggage
              </span>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {booking.baggage || "Standard"}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Ticket Number
              </span>
              <p className="text-sm font-mono font-medium text-slate-900 mt-1 truncate">
                {booking.ticketNumber}
              </p>
            </div>
          </div>

          {/* Booking Metadata Banner */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500">
                Booked through <strong>{booking.vendor.replace(/_/g, " ")}</strong>
                {booking.bookingSource ? ` via ${booking.bookingSource}` : ""}
              </span>
              <p className="text-slate-400 font-mono">
                Booking Date: {new Date(booking.bookingDate).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <span className="text-slate-400 uppercase text-[10px] block">
                Corporate Fare
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {booking.currency} {Number(booking.fare).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
