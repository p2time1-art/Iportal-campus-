import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { CalendarCheck, Loader2, Save, Check } from "lucide-react";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "late", label: "Late", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "excused", label: "Excused", color: "bg-blue-100 text-blue-700 border-blue-300" }
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function TeacherAttendance() {
  const { user, schoolId, role } = useCurrentUser();
  const { sessions, terms, classes, loading: ctxLoading } = useAcademicContext(schoolId);

  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myClassIds, setMyClassIds] = useState(null);

  const activeSession = useMemo(() => sessions.find((s) => s.is_active) || sessions[0] || null, [sessions]);
  const sessionId = activeSession?.id || "";
  const currentTerm = useMemo(() => terms.find((t) => String(t.session_id) === String(sessionId) && t.is_current) || terms.find((t) => String(t.session_id) === String(sessionId)) || null, [terms, sessionId]);
  const termId = currentTerm?.id || "";

  // Teachers: restrict to assigned classes
  useEffect(() => {
    if (role !== "teacher" || !user?.id || !schoolId) { setMyClassIds(null); return; }
    (async () => {
      try {
        const teachers = await base44.entities.Teacher.filter({ user_id: user.id }, "-created_date", 5);
        const myTeacherId = (teachers || [])[0]?.id;
        if (!myTeacherId) { setMyClassIds([]); return; }
        const assigns = await base44.entities.TeacherAssignment.filter({ school_id: schoolId, teacher_id: myTeacherId }, "-created_date", 200);
        setMyClassIds([...new Set((assigns || []).map((a) => a.class_id))]);
      } catch (_e) {
        setMyClassIds([]);
      }
    })();
  }, [role, user, schoolId]);

  const availableClasses = myClassIds === null ? classes : classes.filter((c) => myClassIds.includes(c.id));

  const loadData = useCallback(async () => {
    if (!classId || !date) return;
    setLoadingData(true);
    setSaved(false);
    try {
      const [students, existing] = await Promise.all([
        base44.entities.ClassAssignment.filter({ school_id: schoolId, class_id: classId, session_id: sessionId }, "-created_date", 200),
        base44.entities.Attendance.filter({ school_id: schoolId, class_id: classId, date }, "-created_date", 200)
      ]);
      const existingMap = {};
      (existing || []).forEach((a) => { existingMap[a.student_id] = a; });
      const built = (students || []).map((s) => ({
        student_id: s.student_id,
        student_name: s.student_name,
        attendance_id: existingMap[s.student_id]?.id || null,
        status: existingMap[s.student_id]?.status || "present"
      }));
      setRows(built);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoadingData(false);
    }
  }, [classId, date, schoolId, sessionId]);

  useEffect(() => { if (classId && date) loadData(); else setRows([]); }, [classId, date, loadData]);

  const setStatus = (studentId, status) => {
    setRows((prev) => prev.map((r) => r.student_id === studentId ? { ...r, status } : r));
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const className = classes.find((c) => c.id === classId)?.name || "";
      const ops = rows.map((r) => {
        const payload = {
          school_id: schoolId,
          session_id: sessionId,
          term_id: termId,
          class_id: classId,
          class_name: className,
          student_id: r.student_id,
          student_name: r.student_name,
          date,
          status: r.status,
          recorded_by_id: user.id,
          recorded_by_name: user.full_name || user.email || ""
        };
        if (r.attendance_id) {
          return base44.entities.Attendance.update(r.attendance_id, payload);
        }
        return base44.entities.Attendance.create(payload);
      });
      await Promise.all(ops);
      await loadData();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (_e) {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => setRows((prev) => prev.map((r) => ({ ...r, status })));

  if (ctxLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <AdminPageHeader title="Attendance" subtitle="Mark daily attendance for your class." icon={CalendarCheck} />

      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Class</label>
            <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)} disabled={myClassIds !== null && availableClasses.length === 0}>
              <option value="">Select class…</option>
              {availableClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={selectCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {classId && (
        <>
          {loadingData ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No students in this class" description="There are no students assigned to this class for the active session." />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Mark all:</span>
                {STATUS_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => markAll(o.value)} className={`h-8 px-3 rounded-lg border text-xs font-semibold ${o.color} hover:opacity-80`}>
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                        <th className="px-4 py-3 font-semibold">Student</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={r.student_id} className={i % 2 === 1 ? "bg-secondary/20" : ""}>
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.student_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {STATUS_OPTIONS.map((o) => (
                                <button
                                  key={o.value}
                                  onClick={() => setStatus(r.student_id, o.value)}
                                  className={`h-8 px-3 rounded-lg border text-xs font-semibold transition-all ${r.status === o.value ? o.color : "bg-white border-border text-muted-foreground hover:bg-secondary"}`}
                                >
                                  {o.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button onClick={save} disabled={saving} className="h-10 px-5 rounded-xl bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold hover:bg-[hsl(var(--brand-navy-light))] disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Attendance
                </button>
                {saved && <span className="text-sm font-semibold text-[hsl(var(--brand-green))] flex items-center gap-1"><Check className="w-4 h-4" /> Saved</span>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}