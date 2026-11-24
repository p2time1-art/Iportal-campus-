import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import { formatCurrency } from "@/lib/finance";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AnalyticsFilterBar from "@/components/analytics/AnalyticsFilterBar";
import KPICard from "@/components/analytics/KPICard";
import ChartCard from "@/components/analytics/ChartCard";
import { GradeDistributionPie, PerformanceBarChart, AttendanceTrendChart, RevenueAreaChart } from "@/components/analytics/Charts";
import { TrendingUp, CalendarCheck, ClipboardList, FileBarChart, Award, Wallet, CreditCard, Loader2, AlertTriangle } from "lucide-react";

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'academic', label: 'Academic' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'financial', label: 'Finance' },
  { key: 'assignments', label: 'Assignments' }
];

export default function StudentAnalytics() {
  const { schoolId } = useCurrentUser();
  const { sessions, terms } = useAcademicContext(schoolId);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ session_id: '', term_id: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getSchoolAnalytics", {
        report_type: activeTab, school_id: schoolId,
        session_id: filters.session_id || undefined, term_id: filters.term_id || undefined
      });
      setData(res.data || res);
    } catch (e) { setError(e.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [schoolId, activeTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtNaira = (n) => formatCurrency(n);

  if (loading && !data) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center py-20 text-center"><AlertTriangle className="w-10 h-10 text-destructive mb-3" /><p className="text-sm text-muted-foreground">{error}</p></div>;

  return (
    <div>
      <AdminPageHeader title="My Analytics" subtitle="Track your academic performance" icon={FileBarChart} />
      <AnalyticsFilterBar sessions={sessions} terms={terms} filters={filters} onFilterChange={setFilters} showClass={false} showSubject={false} />

      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-thin pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === t.key ? 'bg-[hsl(var(--brand-navy))] text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> : (
        <>
          {activeTab === 'overview' && data && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard icon={TrendingUp} label="Overall Average" value={`${data.academic?.average ?? 0}%`} color="green" />
              <KPICard icon={FileBarChart} label="Published Results" value={data.academic?.totalResults ?? 0} color="indigo" />
              <KPICard icon={CalendarCheck} label="Attendance" value={`${data.attendance?.attendance_rate ?? 0}%`} color="navy" />
              <KPICard icon={ClipboardList} label="Assignments" value={data.assignments?.total ?? 0} color="orange" />
            </div>
          )}
          {activeTab === 'academic' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={FileBarChart} label="Total Results" value={data.totalResults ?? 0} color="indigo" />
                <KPICard icon={TrendingUp} label="Average" value={`${data.overallAverage ?? 0}%`} color="green" />
                <KPICard icon={Award} label="Pass Rate" value={`${data.passRate?.pass_rate ?? 0}%`} color="navy" />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="My Grade Distribution" icon={Award}><GradeDistributionPie data={data.gradeDistribution} /></ChartCard>
                <ChartCard title="Subject Performance" icon={FileBarChart}><PerformanceBarChart data={data.subjectPerformance} /></ChartCard>
              </div>
              {data.termPerformance && data.termPerformance.length > 0 && (
                <ChartCard title="Term Performance" icon={TrendingUp}>
                  <div className="space-y-2">
                    {data.termPerformance.map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
                        <span className="text-sm font-medium text-foreground">{t.term_name}</span>
                        <span className="text-sm font-bold text-[hsl(var(--brand-indigo))]">{t.average}%</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </div>
          )}
          {activeTab === 'attendance' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={CalendarCheck} label="Rate" value={`${data.stats?.attendance_rate ?? 0}%`} color="green" />
                <KPICard icon={CalendarCheck} label="Present" value={data.stats?.present ?? 0} color="indigo" />
                <KPICard icon={CalendarCheck} label="Absent" value={data.stats?.absent ?? 0} color="red" />
                <KPICard icon={CalendarCheck} label="Late" value={data.stats?.late ?? 0} color="orange" />
              </div>
              <ChartCard title="My Attendance Trend" icon={TrendingUp}><AttendanceTrendChart data={data.trend} /></ChartCard>
            </div>
          )}
          {activeTab === 'financial' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={Wallet} label="Total Charges" value={fmtNaira(data.summary?.totalCharges ?? 0)} color="indigo" />
                <KPICard icon={CreditCard} label="Total Paid" value={fmtNaira(data.summary?.totalPaid ?? 0)} color="green" />
                <KPICard icon={Wallet} label="Outstanding" value={fmtNaira(data.summary?.outstanding ?? 0)} color="red" />
                <KPICard icon={TrendingUp} label="Collection Rate" value={`${data.summary?.collectionRate ?? 0}%`} color="navy" />
              </div>
              {data.paymentTrend && data.paymentTrend.length > 0 && (
                <ChartCard title="Payment History" icon={CreditCard}><RevenueAreaChart data={data.paymentTrend} /></ChartCard>
              )}
            </div>
          )}
          {activeTab === 'assignments' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={ClipboardList} label="Total" value={data.total ?? 0} color="indigo" />
                <KPICard icon={ClipboardList} label="Submissions" value={data.totalSubmissions ?? 0} color="green" />
                <KPICard icon={Award} label="Graded" value={data.graded ?? 0} color="orange" />
                <KPICard icon={TrendingUp} label="Avg Score" value={data.avgScore ?? 0} color="navy" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}