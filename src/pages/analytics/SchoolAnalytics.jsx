import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import { formatCurrency } from "@/lib/finance";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AnalyticsFilterBar from "@/components/analytics/AnalyticsFilterBar";
import KPICard from "@/components/analytics/KPICard";
import ChartCard from "@/components/analytics/ChartCard";
import { GradeDistributionPie, PerformanceBarChart, AttendanceTrendChart, RevenueAreaChart, SimpleBarChart } from "@/components/analytics/Charts";
import { GraduationCap, Users, TrendingUp, CalendarCheck, Wallet, CreditCard, ClipboardList, FileBarChart, Loader2, AlertTriangle, BookOpen, Award } from "lucide-react";

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'academic', label: 'Academic' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'financial', label: 'Finance' },
  { key: 'students', label: 'Students' },
  { key: 'staff', label: 'Staff' },
  { key: 'assignments', label: 'Assignments' }
];

export default function SchoolAnalytics() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlSchoolId = urlParams.get('school_id');
  const { schoolId: userSchoolId, school, role } = useCurrentUser();
  const schoolId = urlSchoolId || userSchoolId;
  const { sessions, terms, classes, subjects } = useAcademicContext(schoolId);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ session_id: '', term_id: '', class_id: '', subject_id: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getSchoolAnalytics", {
        report_type: activeTab,
        school_id: schoolId,
        session_id: filters.session_id || undefined,
        term_id: filters.term_id || undefined,
        class_id: filters.class_id || undefined,
        subject_id: filters.subject_id || undefined
      });
      setData(res.data || res);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [schoolId, activeTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtNaira = (n) => formatCurrency(n);

  if (loading && !data) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center py-20 text-center"><AlertTriangle className="w-10 h-10 text-destructive mb-3" /><p className="text-sm text-muted-foreground">{error}</p></div>;
  }

  return (
    <div>
      <AdminPageHeader title="School Analytics" subtitle={school?.name || "Analytics dashboard"} icon={FileBarChart} />

      <AnalyticsFilterBar sessions={sessions} terms={terms} classes={classes} subjects={subjects} filters={filters} onFilterChange={setFilters} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-thin pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === t.key ? 'bg-[hsl(var(--brand-navy))] text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeTab === 'overview' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={GraduationCap} label="Total Students" value={data.students?.total ?? 0} sub={`${data.students?.active ?? 0} active`} color="indigo" />
                <KPICard icon={Users} label="Total Staff" value={data.staff?.total ?? 0} sub={`${data.staff?.active ?? 0} active`} color="orange" />
                <KPICard icon={TrendingUp} label="Academic Average" value={`${data.academic?.average ?? 0}%`} sub={`${data.academic?.totalResults ?? 0} results`} color="green" />
                <KPICard icon={CalendarCheck} label="Attendance Rate" value={`${data.attendance?.attendance_rate ?? 0}%`} sub={`${data.attendance?.total ?? 0} records`} color="navy" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={Wallet} label="Total Charges" value={fmtNaira(data.finance?.totalCharges ?? 0)} color="indigo" />
                <KPICard icon={CreditCard} label="Total Collected" value={fmtNaira(data.finance?.totalPaid ?? 0)} color="green" />
                <KPICard icon={Wallet} label="Outstanding" value={fmtNaira(data.finance?.outstanding ?? 0)} sub={`${data.finance?.collectionRate ?? 0}% collected`} color="red" />
                <KPICard icon={CreditCard} label="Online Volume" value={fmtNaira(data.onlinePayments?.volume ?? 0)} sub={`${data.onlinePayments?.successRate ?? 0}% success`} color="blue" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={ClipboardList} label="Assignments" value={data.assignments?.total ?? 0} sub={`${data.assignments?.submissions ?? 0} submissions`} color="orange" />
                <KPICard icon={TrendingUp} label="Pass Rate" value={`${data.academic?.passRate ?? 0}%`} color="green" />
              </div>
            </div>
          )}

          {/* ACADEMIC */}
          {activeTab === 'academic' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={FileBarChart} label="Total Results" value={data.totalResults ?? 0} color="indigo" />
                <KPICard icon={TrendingUp} label="Overall Average" value={`${data.overallAverage ?? 0}%`} color="green" />
                <KPICard icon={Award} label="Pass Rate" value={`${data.passRate?.pass_rate ?? 0}%`} sub={`${data.passRate?.passed ?? 0} passed · ${data.passRate?.failed ?? 0} failed`} color="navy" />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Grade Distribution" icon={Award}>
                  <GradeDistributionPie data={data.gradeDistribution} />
                </ChartCard>
                <ChartCard title="Subject Performance" icon={BookOpen}>
                  <PerformanceBarChart data={data.subjectPerformance} />
                </ChartCard>
              </div>
              <ChartCard title="Class Performance Comparison" icon={BookOpen}>
                <PerformanceBarChart data={data.classPerformance} nameKey="class_name" label="Average %" />
              </ChartCard>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Best Performing Subjects" icon={TrendingUp}>
                  <div className="space-y-2">
                    {(data.bestSubjects || []).map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
                        <span className="text-sm font-medium text-foreground">{s.subject_name}</span>
                        <span className="text-sm font-bold text-[hsl(var(--brand-green))]">{s.average_percentage}%</span>
                      </div>
                    ))}
                    {(!data.bestSubjects || data.bestSubjects.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
                  </div>
                </ChartCard>
                <ChartCard title="Subjects Needing Attention" icon={AlertTriangle}>
                  <div className="space-y-2">
                    {(data.worstSubjects || []).map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
                        <span className="text-sm font-medium text-foreground">{s.subject_name}</span>
                        <span className="text-sm font-bold text-[hsl(var(--brand-orange))]">{s.average_percentage}%</span>
                      </div>
                    ))}
                    {(!data.worstSubjects || data.worstSubjects.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === 'attendance' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={CalendarCheck} label="Attendance Rate" value={`${data.stats?.attendance_rate ?? 0}%`} color="green" />
                <KPICard icon={CalendarCheck} label="Present" value={data.stats?.present ?? 0} color="indigo" />
                <KPICard icon={CalendarCheck} label="Absent" value={data.stats?.absent ?? 0} color="red" />
                <KPICard icon={CalendarCheck} label="Late" value={data.stats?.late ?? 0} color="orange" />
              </div>
              <ChartCard title="Attendance Trend" icon={TrendingUp}>
                <AttendanceTrendChart data={data.trend} />
              </ChartCard>
              <ChartCard title="Attendance by Class" icon={BookOpen}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                      <th className="pb-2 font-medium">Class</th><th className="pb-2 font-medium text-center">Present</th><th className="pb-2 font-medium text-center">Absent</th><th className="pb-2 font-medium text-center">Late</th><th className="pb-2 font-medium text-center">Rate</th>
                    </tr></thead>
                    <tbody>
                      {(data.byClass || []).map((c, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-2 font-medium text-foreground">{c.class_name}</td>
                          <td className="py-2 text-center text-[hsl(var(--brand-green))]">{c.present}</td>
                          <td className="py-2 text-center text-[hsl(var(--brand-red))]">{c.absent}</td>
                          <td className="py-2 text-center text-[hsl(var(--brand-orange))]">{c.late}</td>
                          <td className="py-2 text-center font-bold">{c.attendance_rate}%</td>
                        </tr>
                      ))}
                      {(!data.byClass || data.byClass.length === 0) && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          )}

          {/* FINANCIAL */}
          {activeTab === 'financial' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={Wallet} label="Total Charges" value={fmtNaira(data.summary?.totalCharges ?? 0)} color="indigo" />
                <KPICard icon={CreditCard} label="Total Collected" value={fmtNaira(data.summary?.totalPaid ?? 0)} color="green" />
                <KPICard icon={Wallet} label="Outstanding" value={fmtNaira(data.summary?.outstanding ?? 0)} color="red" />
                <KPICard icon={TrendingUp} label="Collection Rate" value={`${data.summary?.collectionRate ?? 0}%`} color="navy" />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Charges by Category" icon={Wallet}>
                  <SimpleBarChart data={data.byCategory} dataKey="totalCharges" nameKey="label" label="Amount" color="hsl(243 75% 59%)" />
                </ChartCard>
                <ChartCard title="Payment Trend" icon={TrendingUp}>
                  <RevenueAreaChart data={data.paymentTrend} />
                </ChartCard>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Payment Methods" icon={CreditCard}>
                  <div className="space-y-2">
                    {(data.methodBreakdown || []).map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
                        <span className="text-sm font-medium text-foreground capitalize">{m.method.replace(/_/g, ' ')}</span>
                        <div className="text-right"><span className="text-sm font-bold text-foreground">{fmtNaira(m.amount)}</span><span className="text-xs text-muted-foreground ml-2">({m.count})</span></div>
                      </div>
                    ))}
                    {(!data.methodBreakdown || data.methodBreakdown.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No payments</p>}
                  </div>
                </ChartCard>
                <ChartCard title="Online Payment Stats" icon={CreditCard}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/40"><p className="text-xs text-muted-foreground">Volume</p><p className="text-lg font-bold text-foreground">{fmtNaira(data.onlineStats?.volume ?? 0)}</p></div>
                    <div className="p-3 rounded-lg bg-secondary/40"><p className="text-xs text-muted-foreground">Success Rate</p><p className="text-lg font-bold text-[hsl(var(--brand-green))]">{data.onlineStats?.successRate ?? 0}%</p></div>
                    <div className="p-3 rounded-lg bg-secondary/40"><p className="text-xs text-muted-foreground">Successful</p><p className="text-lg font-bold text-foreground">{data.onlineStats?.successful ?? 0}</p></div>
                    <div className="p-3 rounded-lg bg-secondary/40"><p className="text-xs text-muted-foreground">Failed</p><p className="text-lg font-bold text-[hsl(var(--brand-red))]">{data.onlineStats?.failed ?? 0}</p></div>
                  </div>
                </ChartCard>
              </div>
              <ChartCard title="Charges by Class" icon={BookOpen}>
                <SimpleBarChart data={data.byClass} dataKey="totalCharges" nameKey="label" label="Amount" color="hsl(25 95% 53%)" />
              </ChartCard>
            </div>
          )}

          {/* STUDENTS */}
          {activeTab === 'students' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={GraduationCap} label="Total Students" value={data.total ?? 0} color="indigo" />
                <KPICard icon={GraduationCap} label="Active" value={data.active ?? 0} color="green" />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Students by Class" icon={BookOpen}>
                  <SimpleBarChart data={data.byClass} dataKey="count" nameKey="class_name" label="Students" color="hsl(243 75% 59%)" />
                </ChartCard>
                <ChartCard title="Students by Gender" icon={Users}>
                  <GradeDistributionPie data={(data.byGender || []).map(g => ({ grade: g.gender, count: g.count }))} />
                </ChartCard>
              </div>
              <ChartCard title="Students by Status" icon={GraduationCap}>
                <div className="flex flex-wrap gap-3">
                  {(data.byStatus || []).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/40">
                      <span className="text-sm font-medium text-foreground capitalize">{s.status}</span>
                      <span className="text-sm font-bold text-foreground">{s.count}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          )}

          {/* STAFF */}
          {activeTab === 'staff' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={Users} label="Total Staff" value={data.total ?? 0} color="indigo" />
                <KPICard icon={Users} label="Active" value={data.active ?? 0} color="green" />
                <KPICard icon={Users} label="Inactive" value={data.inactive ?? 0} color="red" />
              </div>
              <ChartCard title="Staff Workload (Class/Subject Assignments)" icon={BookOpen}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                      <th className="pb-2 font-medium">Teacher</th><th className="pb-2 font-medium text-center">Assignments</th>
                    </tr></thead>
                    <tbody>
                      {(data.workload || []).map((w, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-2 font-medium text-foreground">{w.teacher_name}</td>
                          <td className="py-2 text-center font-bold">{w.class_subjects}</td>
                        </tr>
                      ))}
                      {(!data.workload || data.workload.length === 0) && <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">No data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          )}

          {/* ASSIGNMENTS */}
          {activeTab === 'assignments' && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={ClipboardList} label="Total Assignments" value={data.total ?? 0} color="indigo" />
                <KPICard icon={ClipboardList} label="Submissions" value={data.totalSubmissions ?? 0} color="green" />
                <KPICard icon={Award} label="Graded" value={data.graded ?? 0} color="orange" />
                <KPICard icon={TrendingUp} label="Avg Score" value={data.avgScore ?? 0} color="navy" />
              </div>
              <ChartCard title="Assignments by Subject" icon={BookOpen}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/60">
                      <th className="pb-2 font-medium">Subject</th><th className="pb-2 font-medium text-center">Assignments</th><th className="pb-2 font-medium text-center">Submissions</th>
                    </tr></thead>
                    <tbody>
                      {(data.bySubject || []).map((s, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="py-2 font-medium text-foreground">{s.subject_name}</td>
                          <td className="py-2 text-center">{s.total}</td>
                          <td className="py-2 text-center">{s.submissions}</td>
                        </tr>
                      ))}
                      {(!data.bySubject || data.bySubject.length === 0) && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}