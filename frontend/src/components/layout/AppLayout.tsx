import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export interface AppLayoutProps {
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ title }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all">
        <Header
          title={title}
          onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
