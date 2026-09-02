import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/ui/Skeleton";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center animate-pulse text-white font-bold text-xl">
            ETMS
          </div>
          <div className="space-y-2 w-48 text-center">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
