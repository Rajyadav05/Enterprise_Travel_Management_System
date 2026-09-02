import React from "react";
import {
  Building2,
  Calendar,
  CheckCircle,
  Mail,
  MapPin,
  Shield,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";

export const ProfilePage: React.FC = () => {
  const { user, employee, isAdmin, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-white rounded-modal border border-slate-200 shadow-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-xl font-bold uppercase">
            {employee
              ? `${employee.firstName[0]}${employee.lastName[0]}`
              : user?.email[0]}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {employee
                  ? `${employee.firstName} ${employee.lastName}`
                  : user?.email}
              </h1>
              <Badge
                variant={isAdmin ? "info" : "success"}
                size="md"
              >
                {user?.role?.name || "EMPLOYEE"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {employee ? `Employee ID: ${employee.employeeId}` : `User ID: ${user?.id}`}
            </p>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={logout}>
          Sign Out
        </Button>
      </div>

      {/* Profile Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employment Information */}
        <Card title="Corporate Details" padding="md">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Department
              </dt>
              <dd className="font-semibold text-slate-900 mt-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                {employee?.department?.name || (isAdmin ? "Corporate Administration" : "Unassigned")}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Designation
              </dt>
              <dd className="text-slate-800 mt-1">
                {employee?.designation?.name || (isAdmin ? "System Administrator" : "Staff Member")}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Base Branch / Location
              </dt>
              <dd className="text-slate-800 mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                {employee?.branch ? `${employee.branch.name} (${employee.branch.city})` : "Headquarters"}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Employment Status
              </dt>
              <dd className="mt-1">
                <Badge status={employee?.status || "ACTIVE"} size="sm" />
              </dd>
            </div>
          </dl>
        </Card>

        {/* Security & Access Credentials */}
        <Card title="Security & Authentication" padding="md">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Corporate Email
              </dt>
              <dd className="font-mono text-xs text-slate-900 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Role Permissions
              </dt>
              <dd className="text-slate-800 mt-1 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600" />
                {user?.role?.description || `${user?.role?.name} Permissions`}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Account Status
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" /> Active & Verified
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase">
                Member Since
              </dt>
              <dd className="text-slate-600 text-xs mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "2026"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
};
