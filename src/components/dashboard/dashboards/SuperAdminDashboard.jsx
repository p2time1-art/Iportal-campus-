import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, GraduationCap, Users, Wallet, ShieldCheck, ScrollText, ArrowRight, TrendingUp, AlertTriangle, CreditCard, UserCog, FileBarChart, Crown, Megaphone, Clock } from "lucide-react";
import StatCard from "./StatCard";

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await base44.functions.invoke("getPlatformStats", {});
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load platform data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const { stats, recentSchools, recentActivity } = data || {};
  const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

  const quickActions = [
    { label: "Add School", icon: Building2, path: "/app/schools" },
    { label: "Manage Schools", icon: Building2, path: "/app/schools" },
    { label: "Administrators", icon: UserCog, path: "/app/administrators" },
    { label: "Users", icon: Users, path: "/app/users" },
    { label: "Subscriptions", icon: CreditCard, path: "/app/subscriptions" },
    { label: "Transactions", icon: Wallet, path: "/app/platform-transactions" },
    { label: "Reports", icon: FileBarChart, path: "/app/platform-reports" },
    { label: "System Logs", icon: ScrollText, path: "/app/system-logs" }
  ];

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: "linear-gradient(135deg, hsl(263 70% 50%), hsl(243 75% 59%))" }}>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-white/70" />
            <p className="text-white/70 text-sm">Platform Administration</p>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">iPortal Campus Platform</h2>
          <p className="text-white/80 max-w-xl">Monitor all schools, manage platform users, and oversee system-wide activity and security.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Schools" value={stats?.totalSchools ?? 0} color="indigo" />
        <StatCard icon={ShieldCheck} label="Active Schools" value={stats?.activeSchools ?? 0} sub={`${stats?.suspendedSchools ?? 0} suspended`} color="green" />
        <StatCard icon={GraduationCap} label="Total Students" value={stats?.totalStudents ?? 0} color="orange" />
        <StatCard icon={Users} label="Total Teachers" value={stats?.totalTeachers ?? 0} color="navy" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Parents" value={stats?.totalParents ?? 0} color="blue" />
        <StatCard icon={UserCog} label="School Admins" value={stats?.totalSchoolAdmins ?? 0} color="indigo" />
        <StatCard icon={CreditCard} label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} sub={`${stats?.expiringSubscriptions ?? 0} expiring soon`} color="green" />
        <StatCard icon={Wallet} label="Platform Revenue" value={fmtNaira(stats?.platformRevenue ?? 0)} color="navy" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Megaphone} label="Total Announcements" value={stats?.totalAnnouncements ?? 0} color="indigo" />
        <StatCard icon={Megaphone} label="Published" value={stats?.publishedAnnouncements ?? 0} color="green" />
        <StatCard icon={Clock} label="Scheduled" value={stats?.scheduledAnnouncements ?? 0} color="orange" />
      </div>

      {/* Online Payment Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Online Volume" value={fmtNaira(stats?.onlinePaymentVolume ?? 0)} color="green" />
        <StatCard icon={Wallet} label="Successful" value={stats?.onlinePaymentSuccessCount ?? 0} color="indigo" />
        <StatCard icon={Wallet} label="Failed" value={stats?.onlinePaymentFailedCount ?? 0} color="orange" />
        <StatCard icon={Clock} label="Pending" value={stats?.onlinePaymentPendingCount ?? 0} color="navy" />
      </div>

      {/* Quick actions */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.path} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-indigo))]/30 hover:bg-secondary/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center group-hover:bg-[hsl(var(--brand-indigo))]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
                </div>
                <span className="text-xs font-semibold text-foreground text-center">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent schools */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">Recent Schools</h3>
            <Link to="/app/schools" className="text-sm font-semibold text-[hsl(var(--brand-violet))] flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {(recentSchools || []).map((s) => (
              <Link key={s.id} to={`/app/schools/${s.id}`} className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-violet))]/30 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-indigo))] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {s.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.studentCount} students · {s.teacherCount} teachers · {s.plan} plan</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-2 ${
                  s.status === "active" ? "bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]" :
                  s.status === "suspended" ? "bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {s.status}
                </span>
              </Link>
            ))}
            {(!recentSchools || recentSchools.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No schools registered yet</p>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-5 h-5 text-[hsl(var(--brand-violet))]" />
            <h3 className="font-heading font-bold text-lg text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-1">
            {(recentActivity || []).map((log) => (
              <div key={log.id} className="py-3 border-b border-border/40 last:border-0">
                <p className="text-sm text-foreground font-medium">{log.description || log.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {log.actor_name} · {log.actor_role}
                  {log.school_name ? ` · ${log.school_name}` : ""}
                </p>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}