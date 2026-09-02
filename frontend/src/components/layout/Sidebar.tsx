import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Plane,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Sidebar: React.FC<{ isMobileOpen?: boolean; onCloseMobile?: () => void }> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { user, employee, isAdmin, logout } = useAuth();

  const employeeNav = [
    {
      name: "Dashboard",
      path: "/employee/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "New Travel Request",
      path: "/employee/requests/new",
      icon: PlusCircle,
    },
    {
      name: "My Requests",
      path: "/employee/requests",
      icon: FileText,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: UserIcon,
    },
  ];

  const adminNav = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Travel Requests",
      path: "/admin/requests",
      icon: Plane,
    },
    {
      name: "Reports & Analytics",
      path: "/admin/reports",
      icon: TrendingUp,
    },
    {
      name: "Audit Trail",
      path: "/admin/audit-logs",
      icon: History,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: UserIcon,
    },
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  const content = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Compass className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold text-white tracking-tight leading-tight">
            ETMS
          </span>
          <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
            {isAdmin ? "Admin Portal" : "Travel Portal"}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" &&
              item.path !== "/employee/dashboard" &&
              item.path !== "/admin/dashboard" &&
              location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? "bg-slate-800/90 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand-500 rounded-r" />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-brand-400" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0B1120]/60 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {employee
              ? `${employee.firstName[0]}${employee.lastName[0]}`
              : user?.email[0] || "U"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-white truncate">
              {employee
                ? `${employee.firstName} ${employee.lastName}`
                : user?.email}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono truncate">
                {employee?.employeeId || "Staff"}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono bg-brand-950/80 text-brand-300 border border-brand-800/60 px-1 rounded">
                  <ShieldCheck className="w-2.5 h-2.5" /> ADMIN
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 shadow-xl">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0F172A] z-10 animate-in slide-in-from-left">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
