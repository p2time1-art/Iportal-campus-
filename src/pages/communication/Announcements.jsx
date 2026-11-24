import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AnnouncementAdminView from "@/components/communication/AnnouncementAdminView";
import AnnouncementFeedView from "@/components/communication/AnnouncementFeedView";

export default function Announcements() {
  const { role } = useCurrentUser();

  // School admins and super admins get the management interface;
  // teachers, students, and parents get the feed view.
  if (role === "school_admin" || role === "super_admin") {
    return <AnnouncementAdminView />;
  }
  return <AnnouncementFeedView />;
}