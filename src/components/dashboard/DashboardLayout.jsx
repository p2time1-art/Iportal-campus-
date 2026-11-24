import React, { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { applySchoolTheme, DEFAULT_SCHOOL_COLORS, useTenantBranding, usePlatformSettings } from "@/lib/schoolTheme";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, school, role, loading } = useCurrentUser();
  const isSuperAdmin = role === "super_admin";

  // Strict theme isolation: Super Admin uses Platform Settings only; school roles use School Settings only
  const tenantSchool = useTenantBranding({ enabled: !loading && !isSuperAdmin });
  const platformSettings = usePlatformSettings({ enabled: !loading && isSuperAdmin });
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (isSuperAdmin) {
      applySchoolTheme(platformSettings || DEFAULT_SCHOOL_COLORS);
    } else {
      const target = school || tenantSchool;
      if (target) applySchoolTheme(target);
    }
  }, [loading, isSuperAdmin, platformSettings, school, tenantSchool]);

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
