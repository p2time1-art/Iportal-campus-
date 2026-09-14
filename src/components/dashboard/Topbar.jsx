import React from "react";
import { Menu, Search } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import NotificationCenter from "@/components/communication/NotificationCenter";

export default function Topbar({ onMenuClick }) {
  const { user, membership, role } = useCurrentUser();
  const config = {
    super_admin: "Super Admin Dashboard",
    school_admin: "School Administration",
    teacher: "Teacher Portal",
    student: "Student Portal",
    parent: "Parent / Guardian Portal"
  };
  const title = config[role] || "Dashboard";
  const displayName = membership?.user_name || user?.full_name || "User";

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-secondary text-foreground"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-lg text-foreground leading-none">{title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Welcome back, {displayName.split(" ")[0]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search…"
              className="h-9 w-48 lg:w-64 pl-9 pr-3 rounded-lg bg-secondary/60 border border-border/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
            />
          </div>
          <NotificationCenter />
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-indigo))] flex items-center justify-center text-white text-xs font-bold">
            {displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}