import React from "react";

const map = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-50 text-slate-500 border-slate-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-50 text-slate-500 border-slate-200",
  archived: "bg-slate-50 text-slate-500 border-slate-200",
  invited: "bg-amber-50 text-amber-700 border-amber-200",
  graduated: "bg-indigo-50 text-indigo-700 border-indigo-200",
  transferred: "bg-sky-50 text-sky-700 border-sky-200"
};

export default function StatusBadge({ status }) {
  const cls = map[status] || map.inactive;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${cls}`}>
      {status}
    </span>
  );
}