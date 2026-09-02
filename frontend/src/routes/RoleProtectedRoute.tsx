import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRoleName } from "../types";

export interface RoleProtectedRouteProps {
  allowedRoles: UserRoleName[];
  redirectPath?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  redirectPath,
}) => {
  const { role, isAdmin } = useAuth();

  const isAllowed =
    role && (allowedRoles.includes(role) || (allowedRoles.includes("ADMIN") && isAdmin));

  if (!isAllowed) {
    const fallback = isAdmin ? "/admin/dashboard" : "/employee/dashboard";
    return <Navigate to={redirectPath || fallback} replace />;
  }

  return <Outlet />;
};
