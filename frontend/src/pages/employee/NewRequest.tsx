import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Send } from "lucide-react";
import { travelApi } from "../../api/travel.api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../context/ToastContext";
import type { TripType } from "../../types";

export const NewTravelRequest: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState<TripType>("ROUND_TRIP");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!origin.trim()) errors.origin = "Origin city or airport is required";
    if (!destination.trim()) errors.destination = "Destination city or airport is required";
    if (!departureDate) errors.departureDate = "Departure date is required";

    if (tripType === "ROUND_TRIP") {
      if (!returnDate) {
        errors.returnDate = "Return date is required for round trips";
      } else if (new Date(returnDate) < new Date(departureDate)) {
        errors.returnDate = "Return date cannot be earlier than departure date";
      }
    }

    if (!purpose.trim()) {
      errors.purpose = "Business purpose is required";
    } else if (purpose.trim().length < 5) {
      errors.purpose = "Purpose should be descriptive (at least 5 characters)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const created = await travelApi.createRequest({
        origin: origin.trim(),
        destination: destination.trim(),
        departureDate,
        returnDate: tripType === "ROUND_TRIP" ? returnDate : undefined,
        tripType,
        purpose: purpose.trim(),
        additionalInfo: additionalInfo.trim() || undefined,
      });

      success(
        "Request Submitted Successfully!",
        `Your travel request (#${created.id.substring(0, 8)}) is now pending administrator review.`
      );
      navigate(`/employee/requests/${created.id}`);
    } catch (err: unknown) {
      toastError(
        "Failed to Submit Request",
        (err instanceof Error ? err.message : undefined) ||
          "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            New Travel Request
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit a corporate flight & itinerary booking request for review.
          </p>
        </div>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Type Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Trip Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTripType("ROUND_TRIP")}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all text-center flex items-center justify-center gap-2 ${
                  tripType === "ROUND_TRIP"
                    ? "bg-brand-50 border-brand-600 text-brand-700 ring-1 ring-brand-600"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>🔄 Round Trip</span>
              </button>
              <button
                type="button"
                onClick={() => setTripType("ONE_WAY")}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all text-center flex items-center justify-center gap-2 ${
                  tripType === "ONE_WAY"
                    ? "bg-brand-50 border-brand-600 text-brand-700 ring-1 ring-brand-600"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>➡️ One Way</span>
              </button>
            </div>
          </div>

          {/* Route Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Origin (From)"
              placeholder="e.g. Mumbai (BOM)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              error={fieldErrors.origin}
              leftIcon={<MapPin className="w-4 h-4" />}
              required
            />
            <Input
              label="Destination (To)"
              placeholder="e.g. Dubai (DXB)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              error={fieldErrors.destination}
              leftIcon={<MapPin className="w-4 h-4" />}
              required
            />
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Departure Date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              error={fieldErrors.departureDate}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
            {tripType === "ROUND_TRIP" && (
              <Input
                type="date"
                label="Return Date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                error={fieldErrors.returnDate}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Business Purpose <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Explain the business reason for travel (client meeting, conference, project delivery)..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={`w-full p-3 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.purpose
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-brand-600 focus:ring-brand-600/20"
                }`}
              />
            </div>
            {fieldErrors.purpose && (
              <p className="text-xs text-red-600 font-medium">
                {fieldErrors.purpose}
              </p>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Additional Information / Preferences (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Preferred airline, flight timing, seat preference (aisle/window), extra luggage..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-brand-600 focus:ring-brand-600/20 transition-colors"
            />
          </div>

          {/* Submit and Cancel Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Submit Travel Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
