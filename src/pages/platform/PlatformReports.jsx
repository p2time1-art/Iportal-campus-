import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatCurrency } from "@/lib/finance";
import { exportToCSV } from "@/lib/exportUtils";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import KPICard from "@/components/analytics/KPICard";
import ChartCard from "@/components/analytics/ChartCard";
import { GrowthTrendChart, RevenueAreaChart, SimpleBarChart } from "@/components/analytics/Charts";
import { Building2, GraduationCap, Users, Wallet, CreditCard, TrendingUp, AlertTriangle, Download, Loader2, ScrollText, UserCog, Megaphone } from "lucide-react";

export default function PlatformReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await base44.functions.invoke("getPlatformAnalytics", { report_type: "overview" });
        if (mounted) setData(result.data || result);
      } catch (e) { if (mounted) setError(e.message || "Failed to load"); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center py-20 text-center"><AlertTriangle className="w-10 h-10 text-destructive mb-3" /><p className="text-sm text-muted-foreground">{error}</p></div>;

  const { stats, schoolComparison, trends, recentActivity } = data || {};
  const fmtNaira = (n) => formatCurrency(n);

  return (
    <div>
      <AdminPageHeader title="Platform Reports" subtitle="Platform-wide operational analytics" icon={TrendingUp}
        actionLabel="Export Schools" onAction={() => exportToCSV("platform_schools", schoolComparison || [], ["name", "status", "plan", "studentCount", "teacherCount", "parentCount"])} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPICard icon={Building2} label="Total Schools" value={stats?.totalSchools ?? 0} sub={`${stats?.activeSchools ?? 0} active`} color="indigo" />
        <KPICard icon={GraduationCap} label="Total Students" value={stats?.totalStudents ?? 0} color="orange" />
        <KPICard icon={Users} label="Total Teachers" value={stats?.totalTeachers ?? 0} color="navy" />
        <KPICard icon={UserCog} label="Total Users" value={stats?.totalUsers ?? 0} color="blue" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard icon={Wallet} label="Platform Revenue" value={fmtNaira(stats?.platformRevenue ?? 0)} color="green" />
        <KPICard icon={CreditCard} label="Online Volume" value={fmtNaira(stats?.onlinePaymentVolume ?? 0)} color="indigo" />
        <KPICard icon={CreditCard} label="Online Success" value={`${stats?.onlinePaymentSuccessRate ?? 0}%`} sub={`${stats?.onlinePaymentSuccess ?? 0} successful`} color="green" />
        <KPICard icon={Megaphone} label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} sub={`${stats?.expiringSubscriptions ?? 0} expiring`} color="orange" />
      </div>

      {/* Growth Trends */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="School Growth" icon={Building2}><GrowthTrendChart data={trends?.schoolGrowth} name="Schools" /></ChartCard>
        <ChartCard title="Student Growth" icon={GraduationCap}><GrowthTrendChart data={trends?.studentGrowth} name="Students" /></ChartCard>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="User Growth" icon={Users}><GrowthTrendChart data={trends?.userGrowth} name="Users" /></ChartCard>
        <ChartCard title="Revenue Trend" icon={Wallet}><RevenueAreaChart data={trends?.revenueTrend} name="Revenue" /></ChartCard>
      </div>

      {/* School Comparison */}
      <ChartCard title="School Comparison" icon={Building2} className="mb-6"
        action={<button onClick={() => exportToCSV("school_comparison", schoolComparison || [], ["name", "status", "plan", "studentCount", "teacherCount", "parentCount"])} className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5" /> CSV</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/60">
              <th className="pb-2 font-medium">School</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Plan</th><th className="pb-2 font-medium text-center">Students</th><th className="pb-2 font-medium text-center">Teachers</th><th className="pb-2 font-medium text-center">Parents</th>
            </tr></thead>
            <tbody>
              {(schoolComparison || []).map(s => (
                <tr key={s.id} className="border-b border-border/40 last:border-0">
                  <td className="py-2 font-medium text-foreground"><Link to={`/app/analytics?school_id=${s.id}`} className="hover:text-[hsl(var(--brand-indigo))] hover:underline">{s.name}</Link></td>
                  <td className="py-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]' : 'bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]'}`}>{s.status}</span></td>
                  <td className="py-2 capitalize text-muted-foreground">{s.plan}</td>
                  <td className="py-2 text-center font-bold">{s.studentCount}</td>
                  <td className="py-2 text-center">{s.teacherCount}</td>
                  <td className="py-2 text-center">{s.parentCount}</td>
                </tr>
              ))}
              {(!schoolComparison || schoolComparison.length === 0) && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No schools</td></tr>}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Users by Role */}
      <ChartCard title="Users by Role" icon={Users} className="mb-6">
        <SimpleBarChart data={stats?.usersByRole || []} dataKey="count" nameKey="role" label="Users" color="hsl(263 70% 50%)" />
      </ChartCard>

      {/* Recent Activity */}
      <ChartCard title="Recent Platform Activity" icon={ScrollText}>
        <div className="space-y-1">
          {(recentActivity || []).map(log => (
            <div key={log.id} className="py-2 border-b border-border/40 last:border-0">
              <p className="text-sm text-foreground font-medium">{log.description || log.action}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{log.actor_name} · {log.actor_role}{log.school_name ? ` · ${log.school_name}` : ""}</p>
            </div>
          ))}
          {(!recentActivity || recentActivity.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>}
        </div>
      </ChartCard>
    </div>
  );
}