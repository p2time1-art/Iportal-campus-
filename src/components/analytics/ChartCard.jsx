import React from "react";
import { cn } from "@/lib/utils";

export default function ChartCard({ title, icon: Icon, children, className = "", action = undefined }) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border/60 shadow-sm p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
          <h3 className="font-heading font-bold text-sm text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}