import React, { useState, useMemo } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAcademicContext } from "@/hooks/useAcademicContext";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function AssignFeesDrawer({ open, onClose, schoolId, studentId, defaultClassId, onDone }) {
  const { sessions, terms, classes } = useAcademicContext(schoolId);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState(defaultClassId || "");
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const sessionTerms = useMemo(() => terms.filter((t) => t.session_id === sessionId), [terms, sessionId]);

  if (!open) return null;

  const handleAssign = async () => {
    if (!sessionId) { setError("Please select an academic session."); return; }
    setAssigning(true); setError(""); setResult(null);
    try {
      const payload = { school_id: schoolId, academic_session_id: sessionId };
      if (termId) payload.term_id = termId;
      if (classId) payload.class_id = classId;
      if (studentId) payload.student_ids = [studentId];
      const res = await base44.functions.invoke("assignFees", payload);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to assign fees.");
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setResult(null); setError("");
    if (result) onDone?.();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleClose} />
      <div className="fixed right-0 inset-y-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <h2 className="font-heading font-bold text-base text-foreground">Assign Fees</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {result ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground">Fees Assigned</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {result.created} charge{result.created !== 1 ? "s" : ""} created<br />
                {result.skipped} existing charge{result.skipped !== 1 ? "s" : ""} skipped (already assigned)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {studentId ? "This will generate charges for this student from matching fee structures." : "This will generate charges for all active students in the selected scope from matching fee structures."}
              </p>
              <div>
                <label className={labelCls}>Academic Session *</label>
                <select className={selectCls} value={sessionId} onChange={(e) => { setSessionId(e.target.value); setTermId(""); }}>
                  <option value="">Select session…</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Term (optional)</label>
                <select className={selectCls} value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!sessionId}>
                  <option value="">All Terms</option>
                  {sessionTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {!studentId && (
                <div>
                  <label className={labelCls}>Class (optional — leave empty for all classes)</label>
                  <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
                    <option value="">All Classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  This process is idempotent — running it twice will not create duplicate charges. Only charges that don't already exist will be created.
                </p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            </div>
          )}
        </div>
        <div className="border-t border-border p-4 shrink-0">
          {result ? (
            <button onClick={handleClose} className="w-full h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold">Done</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleClose} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">Cancel</button>
              <button onClick={handleAssign} disabled={assigning || !sessionId} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {assigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</> : "Assign Fees"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}