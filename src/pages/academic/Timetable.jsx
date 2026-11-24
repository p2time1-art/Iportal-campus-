import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

export default function Timetable() {
  const { schoolId, role } = useCurrentUser();
  const { classes, subjects } = useAcademicContext(schoolId);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    class_id: "", subject_id: "", teacher_id: "", day_of_week: "monday", starts_at: "08:00", ends_at: "09:00", room: ""
  });

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(String(classes[0].id));
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (!schoolId) return;
    base44.entities.Teacher.filter({ school_id: schoolId }, "full_name", 200)
      .then((t) => setTeachers(t || []))
      .catch(() => {});
  }, [schoolId]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params = { school_id: schoolId };
      if (selectedClassId) params.class_id = selectedClassId;
      const list = await base44.entities.TimetableEntry.filter(params, "starts_at", 500);
      setEntries(list || []);
    } catch (_e) {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedClassId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.class_id || !form.subject_id || !form.teacher_id) return;
    setSaving(true);
    try {
      await base44.entities.TimetableEntry.create({ ...form, school_id: schoolId });
      setDrawerOpen(false);
      load();
    } catch (_e) {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.TimetableEntry.delete(id);
      load();
    } catch (_e) {}
  };

  const canManage = role === "school_admin" || role === "super_admin";

  return (
    <div>
      <AdminPageHeader
        title="Class Timetable"
        subtitle="View and manage weekly class schedules and subject periods."
        actionLabel={canManage ? "Add Period" : undefined}
        onAction={canManage ? () => { setForm({ ...form, class_id: selectedClassId || (classes[0]?.id ?? "") }); setDrawerOpen(true); } : undefined}
        icon={Calendar}
      />

      <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-5 flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">Class:</span>
        <select className="h-10 px-3 rounded-lg border border-border bg-white text-sm" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Calendar} title="No timetable periods yet" description="Add subject periods to build the weekly timetable for this class." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map((day) => {
            const dayEntries = entries.filter((e) => (e.day_of_week || "").toLowerCase() === day);
            return (
              <div key={day} className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide text-foreground mb-3 pb-2 border-b border-border/50">
                  {day}
                </h3>
                <div className="space-y-2.5">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No periods</p>
                  ) : (
                    dayEntries.map((e) => (
                      <div key={e.id} className="rounded-xl bg-slate-50 border border-border/50 p-3 relative group">
                        <p className="text-xs font-mono font-semibold text-[hsl(var(--brand-indigo))]">{e.starts_at} – {e.ends_at}</p>
                        <p className="font-bold text-sm text-foreground mt-0.5">{e.subject_name}</p>
                        <p className="text-xs text-muted-foreground">{e.teacher_name}</p>
                        {e.room && <p className="text-[11px] text-muted-foreground mt-0.5">Room: {e.room}</p>}
                        {canManage && (
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="absolute top-2 right-2 p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Timetable Period"
        description="Schedule a class subject and teacher for a weekly period."
        footer={
          <div className="flex gap-2">
            <button onClick={() => setDrawerOpen(false)} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold disabled:opacity-60">
              {saving ? "Saving…" : "Save Period"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Class *</label>
            <select className={inputCls} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
              <option value="">Select class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject *</label>
            <select className={inputCls} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">Select subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Teacher *</label>
            <select className={inputCls} value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
              <option value="">Select teacher…</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Day of Week *</label>
            <select className={inputCls} value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
              {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Starts At</label>
              <input type="time" className={inputCls} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Ends At</label>
              <input type="time" className={inputCls} value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Room (optional)</label>
            <input className={inputCls} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. Block A Room 3" />
          </div>
        </div>
      </FormDrawer>
    </div>
  );
}
