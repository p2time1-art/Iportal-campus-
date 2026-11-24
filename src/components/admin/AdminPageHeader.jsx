import React from "react";
import { Plus } from "lucide-react";

export default function AdminPageHeader({
  title,
  subtitle = "",
  icon: Icon = undefined,
  actionLabel = "",
  onAction = undefined,
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-heading font-extrabold text-xl text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}