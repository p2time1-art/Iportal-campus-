import React from "react";

const map = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  invited: "bg-amber-50 text-amber-700 border-amber-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  inactive: "bg-slate-50 text-slate-500 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200"
};

export default function AccountStatusBadge({ status }) {
  const cls = map[status] || map.inactive;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${cls}`}>
      {status}
    </span>
  );
}