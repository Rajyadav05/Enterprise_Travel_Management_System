import React from "react";
import { Link } from "react-router-dom";
import { Bell, Menu, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export interface HeaderProps {
  onToggleMobileSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  title,
}) => {
  const { user, employee, isAdmin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between shadow-sm">
      {/* Left Title & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell (Visual Demo) */}
        <button
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Pill */}
        <Link
          to="/profile"
          className="flex items-center gap-3 p-1.5 pl-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
        >
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {employee
                ? `${employee.firstName} ${employee.lastName}`
                : user?.email}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {employee?.department?.name || (isAdmin ? "Administration" : "Staff")}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs">
            {isAdmin ? (
              <Shield className="w-4 h-4 text-brand-600" />
            ) : (
              <UserIcon className="w-4 h-4 text-brand-600" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};
