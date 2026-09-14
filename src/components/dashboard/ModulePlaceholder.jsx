import React from "react";
import { useParams } from "react-router-dom";
import { Construction } from "lucide-react";

export default function ModulePlaceholder() {
  const { module } = useParams();
  const label = (module || "module").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center mb-5">
        <Construction className="w-8 h-8 text-[hsl(var(--brand-indigo))]" />
      </div>
      <h2 className="font-heading font-bold text-2xl text-foreground mb-2">{label}</h2>
      <p className="text-muted-foreground max-w-md">
        This module is part of an upcoming milestone. The architecture and navigation are in place —
        the full functionality will be rolled out incrementally.
      </p>
    </div>
  );
}