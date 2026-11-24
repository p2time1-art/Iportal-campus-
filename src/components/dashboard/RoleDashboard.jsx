import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminDashboard from "./dashboards/AdminDashboard";
import BursarDashboard from "./dashboards/BursarDashboard";
import ExamOfficerDashboard from "./dashboards/ExamOfficerDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";
import SuperAdminDashboard from "./dashboards/SuperAdminDashboard";
import FeatureRoute from "@/components/common/FeatureRoute";

export default function RoleDashboard() {
  const { role } = useCurrentUser();

  switch (role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "school_admin":
      return <AdminDashboard />;
    case "bursar":
      return <BursarDashboard />;
    case "exam_officer":
      return <ExamOfficerDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "student":
      return <StudentDashboard />;
    case "parent":
      return (
        <FeatureRoute featureKey="parents" backTo="/app/my-account" backLabel="Go to My Account">
          <ParentDashboard />
        </FeatureRoute>
      );
    default:
      return <AdminDashboard />;
  }
}
