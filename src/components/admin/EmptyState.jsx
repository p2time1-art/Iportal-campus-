import React from "react";
import { Plus } from "lucide-react";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        {Icon && <Icon className="w-7 h-7 text-muted-foreground" />}
      </div>
      <h3 className="font-heading font-bold text-lg text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> {actionLabel}
        </button>
      )}
    </div>
  );
}