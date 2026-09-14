import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, X, ChevronRight } from "lucide-react";
import { navConfig } from "./navConfig";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, membership, school, role } = useCurrentUser();
  const navigate = useNavigate();
  const config = navConfig[role] || navConfig.student;

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/";
  };

  const displayName = membership?.user_name || user?.full_name || user?.email || "User";
  const schoolName = role === "super_admin" ? "Platform Administration" : (school?.name || membership?.school_name || "Your School");
  const initials = displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 z-50 lg:z-30 w-[260px] h-screen bg-[hsl(var(--sidebar-background))] flex flex-col transition-transform duration-300 shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[hsl(var(--sidebar-border))] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(243_75%_59%)] to-[hsl(263_70%_50%)] flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="block font-heading font-extrabold text-sm text-white tracking-tight">
                iPortal<span className="text-[hsl(243_75%_70%)]"> Campus</span>
              </span>
              <span className="text-[10px] text-white/40 tracking-wide uppercase">{config.label}</span>
            </div>
          </div>
          <button
            className="lg:hidden text-white/50 hover:text-white p-1"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School / context */}
        <div className="px-5 py-4 border-b border-[hsl(var(--sidebar-border))]">
          <p className="text-[10px] uppercase tracking-wide text-white/35 font-semibold mb-1">
            {role === "super_admin" ? "Platform" : "Institution"}
          </p>
          <p className="text-sm font-semibold text-white truncate">{schoolName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-4">
          {config.groups.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.label && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.path === "/app"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                        isActive
                          ? "bg-[hsl(var(--sidebar-primary))] text-white shadow-md"
                          : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-[hsl(var(--sidebar-border))] p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(243_75%_59%)] to-[hsl(263_70%_50%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-red-500/15 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}