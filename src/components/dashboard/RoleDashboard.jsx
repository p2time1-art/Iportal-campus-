import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminDashboard from "./dashboards/AdminDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";
import SuperAdminDashboard from "./dashboards/SuperAdminDashboard";

export default function RoleDashboard() {
  const { role } = useCurrentUser();

  switch (role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "school_admin":
      return <AdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    case "parent":
      return <ParentDashboard />;
    default:
      return <AdminDashboard />;
  }
}