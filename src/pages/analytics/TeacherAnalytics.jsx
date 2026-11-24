import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AnalyticsFilterBar from "@/components/analytics/AnalyticsFilterBar";
import KPICard from "@/components/analytics/KPICard";
import ChartCard from "@/components/analytics/ChartCard";
import { GradeDistributionPie, PerformanceBarChart, AttendanceTrendChart } from "@/components/analytics/Charts";
import { BookOpen, TrendingUp, CalendarCheck, ClipboardList, FileBarChart, Award, Loader2, AlertTriangle } from "lucide-react";

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'academic', label: 'Academic' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'assignments', label: 'Assignments' }
];

export default function TeacherAnalytics() {
  const { schoolId, user } = useCurrentUser();
  const { sessions, terms, classes, subjects } = useAcademicContext(schoolId);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ session_id: '', term_id: '', class_id: '', subject_id: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getSchoolAnalytics", {
        report_type: activeTab, school_id: schoolId,
        session_id: filters.session_id || undefined, term_id: filters.term_id || undefined,
        class_id: filters.class_id || undefined, subject_id: filters.subject_id || undefined
      });
      setData(res.data || res);
    } catch (e) { setError(e.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [schoolId, activeTab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center py-20 text-center"><AlertTriangle className="w-10 h-10 text-destructive mb-3" /><p className="text-sm text-muted-foreground">{error}</p></div>;

  return (
    <div>
      <AdminPageHeader title="My Analytics" subtitle="Performance insights for your classes" icon={FileBarChart} />
      <AnalyticsFilterBar sessions={sessions} terms={terms} classes={classes} subjects={subjects} filters={filters} onFilterChange={setFilters} />

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
              <KPICard icon={BookOpen} label="Assigned Classes" value={data.staff?.total ?? data.assignments?.total ?? 0} color="orange" />
              <KPICard icon={TrendingUp} label="Average Score" value={`${data.academic?.average ?? 0}%`} color="green" />
              <KPICard icon={CalendarCheck} label="Attendance Rate" value={`${data.attendance?.attendance_rate ?? 0}%`} color="indigo" />
              <KPICard icon={ClipboardList} label="Assignments" value={data.assignments?.total ?? 0} sub={`${data.assignments?.submissions ?? 0} submissions`} color="navy" />
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
                <ChartCard title="Grade Distribution" icon={Award}><GradeDistributionPie data={data.gradeDistribution} /></ChartCard>
                <ChartCard title="Subject Performance" icon={BookOpen}><PerformanceBarChart data={data.subjectPerformance} /></ChartCard>
              </div>
              <ChartCard title="Class Performance" icon={BookOpen}><PerformanceBarChart data={data.classPerformance} nameKey="class_name" /></ChartCard>
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
              <ChartCard title="Attendance Trend" icon={TrendingUp}><AttendanceTrendChart data={data.trend} /></ChartCard>
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
              <ChartCard title="By Subject" icon={BookOpen}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/60"><th className="pb-2 font-medium">Subject</th><th className="pb-2 font-medium text-center">Assignments</th><th className="pb-2 font-medium text-center">Submissions</th></tr></thead>
                    <tbody>
                      {(data.bySubject || []).map((s, i) => (<tr key={i} className="border-b border-border/40 last:border-0"><td className="py-2 font-medium text-foreground">{s.subject_name}</td><td className="py-2 text-center">{s.total}</td><td className="py-2 text-center">{s.submissions}</td></tr>))}
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