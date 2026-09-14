import React from "react";

const statusStyles = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  published: "bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] border-[hsl(var(--brand-indigo))]/20",
  rejected: "bg-red-50 text-red-700 border-red-200"
};

const labels = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  published: "Published",
  rejected: "Needs Correction"
};

export default function ResultStatusBadge({ status }) {
  const cls = statusStyles[status] || statusStyles.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] || status}
    </span>
  );
}