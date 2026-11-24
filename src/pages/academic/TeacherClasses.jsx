import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import EmptyState from "@/components/admin/EmptyState";
import { BookOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function TeacherClasses() {
  const { user, schoolId, role } = useCurrentUser();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      let data = await base44.entities.TeacherAssignment.filter({ school_id: schoolId }, "-created_date", 200);
      // Teachers see only their own assignments; admins see all
      if (role === "teacher") {
        const teachers = await base44.entities.Teacher.filter({ user_id: user.id }, "-created_date", 5);
        const myTeacherId = (teachers || [])[0]?.id;
        if (myTeacherId) data = (data || []).filter((a) => a.teacher_id === myTeacherId);
        else data = [];
      }
      setAssignments(data || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [schoolId, role, user]);

  useEffect(() => { load(); }, [load]);

  // Group by class
  const byClass = {};
  (assignments || []).forEach((a) => {
    if (!byClass[a.class_id]) byClass[a.class_id] = { class_name: a.class_name, subjects: [] };
    byClass[a.class_id].subjects.push(a);
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight mb-6">My Classes</h1>

      {assignments.length === 0 ? (
        <EmptyState icon={BookOpen} title="No class assignments" description="You haven't been assigned to any classes yet. Contact your school administrator." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(byClass).map(([classId, info]) => (
            <div key={classId} className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
                </div>
                <h3 className="font-heading font-bold text-foreground">{info.class_name}</h3>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subjects</p>
              <div className="flex flex-wrap gap-1.5">
                {info.subjects.map((s) => (
                  <span key={s.subject_id} className="inline-flex px-2.5 py-1 rounded-lg bg-secondary text-xs font-medium text-foreground">
                    {s.subject_name}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Link to="/app/results" className="flex-1 h-9 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary flex items-center justify-center">Enter Results</Link>
                <Link to="/app/attendance" className="flex-1 h-9 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary flex items-center justify-center">Attendance</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}