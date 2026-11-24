import React from "react";
import { ShieldAlert, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminResults from "./AdminResults";
import ResultEntry from "./ResultEntry";
import StudentResults from "./StudentResults";
import ParentResults from "./ParentResults";

export default function Results() {
  const { role, can } = useCurrentUser();

  if (role === "bursar" || (!can("results.view") && !can("results.view_own") && !can("results.view_children"))) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-foreground mb-2">
          Academic Grades Restricted for Bursar / Accountant
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your sub-admin role (<strong>Bursar / Accountant</strong>) is scoped exclusively to Finance &amp; Billing and cannot view, enter, edit, or publish student examination grades.
        </p>
        <Link
          to="/app/payments"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[hsl(var(--brand-navy))] text-white text-xs font-bold"
        >
          <Wallet className="w-4 h-4" /> Return to Finance &amp; Payments
        </Link>
      </div>
    );
  }

  if (role === "school_admin" || role === "super_admin" || role === "exam_officer") return <AdminResults />;
  if (role === "teacher") return <ResultEntry />;
  if (role === "student") return <StudentResults />;
  if (role === "parent") return <ParentResults />;
  return <AdminResults />;
}
