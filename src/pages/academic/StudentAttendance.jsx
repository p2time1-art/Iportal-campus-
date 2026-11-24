import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import EmptyState from "@/components/admin/EmptyState";
import { CalendarCheck, Loader2 } from "lucide-react";

const statusStyles = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
  excused: "bg-blue-100 text-blue-700 border-blue-300"
};

export default function StudentAttendance() {
  const { user } = useCurrentUser();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await base44.entities.Attendance.filter({ student_user_id: user.id }, "-date", 300);
      setRecords(data || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight mb-6">My Attendance</h1>

      {total === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance records" description="Your attendance will appear here once your teachers start marking it." />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Days</p>
              <p className="text-2xl font-heading font-extrabold text-foreground mt-1">{total}</p>
            </div>
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Present</p>
              <p className="text-2xl font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">{present}</p>
            </div>
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Absent</p>
              <p className="text-2xl font-heading font-extrabold text-red-600 mt-1">{absent}</p>
            </div>
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Attendance</p>
              <p className="text-2xl font-heading font-extrabold text-[hsl(var(--brand-indigo))] mt-1">{percentage}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 1 ? "bg-secondary/20" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground">{r.date}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.class_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[r.status] || statusStyles.absent}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}