import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TeacherAssignments from "./TeacherAssignments";
import StudentAssignments from "./StudentAssignments";

export default function Assignments() {
  const { role } = useCurrentUser();
  if (role === "student") return <StudentAssignments />;
  return <TeacherAssignments />;
}