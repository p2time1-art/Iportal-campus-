import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/**
 * Route guard: restricts access to school admin and super admin roles.
 * Prevents teachers, students, and parents from accessing admin-only pages
 * via direct URL navigation.
 */
export default function SchoolAdminRoute() {
  const { role, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== "school_admin" && role !== "super_admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}