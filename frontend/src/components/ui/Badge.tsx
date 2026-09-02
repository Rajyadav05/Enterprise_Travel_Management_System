import React from "react";
import type { RequestStatus } from "../../types";

export interface BadgeProps {
  status?: RequestStatus | string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  size = "md",
  children,
  className = "",
}) => {
  // Determine variant from status string if not explicitly passed
  let resolvedVariant = variant || "neutral";

  if (status) {
    switch (status.toUpperCase()) {
      case "BOOKED":
      case "ACTIVE":
      case "CONFIRMED":
        resolvedVariant = "success"; // emerald
        break;
      case "APPROVED":
      case "ADMIN":
      case "ONE_WAY":
      case "ROUND_TRIP":
        resolvedVariant = "info"; // blue
        break;
      case "PENDING":
      case "IN_REVIEW":
        resolvedVariant = "warning"; // amber
        break;
      case "REJECTED":
      case "INACTIVE":
      case "RESIGNED":
        resolvedVariant = "danger"; // rose/red
        break;
      case "CANCELLED":
      default:
        resolvedVariant = "neutral"; // slate
    }
  }

  const variantStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  const displayText = children || (status ? status.replace(/_/g, " ") : "");

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border leading-none tracking-tight ${variantStyles[resolvedVariant]} ${sizeStyles[size]} ${className}`}
    >
      {displayText}
    </span>
  );
};
