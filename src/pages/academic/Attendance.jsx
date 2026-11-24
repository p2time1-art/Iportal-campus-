import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TeacherAttendance from "./TeacherAttendance";
import StudentAttendance from "./StudentAttendance";

export default function Attendance() {
  const { role } = useCurrentUser();
  if (role === "student") return <StudentAttendance />;
  return <TeacherAttendance />;
}