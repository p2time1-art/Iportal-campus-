import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function SuperAdminRoute() {
  const { role, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== "super_admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}