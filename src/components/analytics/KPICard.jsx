import React from "react";
import { cn } from "@/lib/utils";

export default function KPICard({ icon: Icon, label, value, sub, trend, color = "indigo" }) {
  const colorMap = {
    indigo: "from-[hsl(243_75%_59%)] to-[hsl(263_70%_50%)]",
    navy: "from-[hsl(222_47%_11%)] to-[hsl(222_40%_25%)]",
    orange: "from-[hsl(25_95%_53%)] to-[hsl(15_85%_55%)]",
    green: "from-[hsl(142_71%_45%)] to-[hsl(150_65%_40%)]",
    red: "from-[hsl(0_84%_60%)] to-[hsl(350_75%_55%)]",
    blue: "from-[hsl(200_80%_50%)] to-[hsl(210_70%_45%)]"
  };

  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-sm p-4 card-hover">
      <div className="flex items-start justify-between mb-2">
        <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md", colorMap[color])}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", trend > 0 ? "bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]" : "bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]")}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xl font-heading font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
    </div>
  );
}