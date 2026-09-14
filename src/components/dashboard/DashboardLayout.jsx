import React, { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useCurrentUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
      </div>
    );
  }

  // First-login password change enforcement — redirect until password is changed
  if (user?.data?.must_change_password && location.pathname !== "/app/change-password") {
    return <Navigate to="/app/change-password" replace />;
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}