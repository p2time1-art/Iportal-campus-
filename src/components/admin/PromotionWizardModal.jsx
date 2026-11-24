import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ArrowRight,
  GraduationCap,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Smart Nigerian / International class progression auto-suggestion.
 * Handles JSS 1→JSS 2→JSS 3→SS 1→SS 2→SS 3→GRADUATE, Primary 1-6, Basic 1-9, Grade 1-12, etc.
 */
function suggestNextClass(cls, allClasses) {
  const raw = (cls?.name || "").trim();
  const upper = raw.toUpperCase();
  const findByPattern = (targetUpper) =>
    allClasses.find((c) => (c.name || "").trim().toUpperCase() === targetUpper) ||
    allClasses.find((c) => (c.name || "").trim().toUpperCase().replace(/\s+/g, "") === targetUpper.replace(/\s+/g, ""));

  // JSS 1..3
  const jss = /^(JSS|JS)\s*([1-3])(.*)$/i.exec(upper);
  if (jss) {
    const num = Number(jss[2]);
    const arm = jss[3] || "";
    if (num < 3) {
      const next = findByPattern(`JSS ${num + 1}${arm}`) || findByPattern(`JSS ${num + 1}`);
      if (next) return { action: "promote", toClassId: String(next.id) };
    } else {
      const next = findByPattern(`SS 1${arm}`) || findByPattern("SS 1") || findByPattern("SSS 1");
      if (next) return { action: "promote", toClassId: String(next.id) };
      return { action: "graduate", toClassId: "GRADUATE" };
    }
  }

  // SS / SSS 1..3
  const ss = /^(SSS|SS)\s*([1-3])(.*)$/i.exec(upper);
  if (ss) {
    const num = Number(ss[2]);
    const arm = ss[3] || "";
    if (num < 3) {
      const next = findByPattern(`${ss[1]} ${num + 1}${arm}`) || findByPattern(`SS ${num + 1}`) || findByPattern(`SSS ${num + 1}`);
      if (next) return { action: "promote", toClassId: String(next.id) };
    } else {
      return { action: "graduate", toClassId: "GRADUATE" };
    }
  }

  // Primary / Basic / Grade / Nursery
  const generic = /^(PRIMARY|PRY|BASIC|GRADE|NURSERY|KG)\s*(\d+)(.*)$/i.exec(upper);
  if (generic) {
    const prefix = generic[1];
    const num = Number(generic[2]);
    const arm = generic[3] || "";
    const next = findByPattern(`${prefix} ${num + 1}${arm}`) || findByPattern(`${prefix} ${num + 1}`);
    if (next) return { action: "promote", toClassId: String(next.id) };
    if (prefix === "PRIMARY" || prefix === "PRY") {
      const jss1 = findByPattern("JSS 1");
      if (jss1) return { action: "promote", toClassId: String(jss1.id) };
      return { action: "graduate", toClassId: "GRADUATE" };
    }
  }

  // Fallback: next class in list order
  const idx = allClasses.findIndex((c) => String(c.id) === String(cls.id));
  if (idx >= 0 && idx < allClasses.length - 1) {
    return { action: "promote", toClassId: String(allClasses[idx + 1].id) };
  }
  return { action: "graduate", toClassId: "GRADUATE" };
}

export default function PromotionWizardModal({ open, onClose, schoolId, sessions = [], onCompleted }) {
  const [step, setStep] = useState(1);
  const [sourceSessionId, setSourceSessionId] = useState("");
  const [targetSessionId, setTargetSessionId] = useState("");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [classMapping, setClassMapping] = useState({}); // { [fromClassId]: toClassId | "GRADUATE" }
  const [studentDecisions, setStudentDecisions] = useState({}); // { [studentId]: "promote" | "repeat" | "graduate" }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!open || !schoolId) return;
    setStep(1);
    setError("");
    setSummary(null);

    const active = sessions.find((s) => s.is_active) || sessions[0];
    const other = sessions.find((s) => String(s.id) !== String(active?.id));
    setSourceSessionId(active ? String(active.id) : "");
    setTargetSessionId(other ? String(other.id) : (active ? String(active.id) : ""));

    setLoading(true);
    Promise.all([
      base44.entities.SchoolClass.filter({ school_id: schoolId, status: "active" }, "name", 200).catch(() => []),
      base44.entities.Student.filter({ school_id: schoolId, status: "active" }, "full_name", 1000).catch(() => []),
    ])
      .then(([clsList, stuList]) => {
        const list = clsList || [];
        setClasses(list);
        setStudents(stuList || []);

        const initialMap = {};
        list.forEach((c) => {
          const suggestion = suggestNextClass(c, list);
          initialMap[String(c.id)] = suggestion.toClassId;
        });
        setClassMapping(initialMap);

        const initialDecisions = {};
        (stuList || []).forEach((st) => {
          const fromId = st.current_class_id ? String(st.current_class_id) : "";
          const dest = initialMap[fromId];
          initialDecisions[String(st.id)] = dest === "GRADUATE" ? "graduate" : "promote";
        });
        setStudentDecisions(initialDecisions);
      })
      .finally(() => setLoading(false));
  }, [open, schoolId, sessions]);

  const studentsByClass = useMemo(() => {
    const grouped = {};
    students.forEach((s) => {
      const cid = s.current_class_id ? String(s.current_class_id) : "unassigned";
      if (!grouped[cid]) grouped[cid] = [];
      grouped[cid].push(s);
    });
    return grouped;
  }, [students]);

  const counts = useMemo(() => {
    let promote = 0;
    let repeat = 0;
    let graduate = 0;
    students.forEach((s) => {
      if (!s.current_class_id) return;
      const d = studentDecisions[String(s.id)] || "promote";
      if (d === "graduate") graduate++;
      else if (d === "repeat") repeat++;
      else promote++;
    });
    return { promote, repeat, graduate, total: promote + repeat + graduate };
  }, [students, studentDecisions]);

  if (!open) return null;

  const updateMapping = (fromClassId, destValue) => {
    setClassMapping((prev) => ({ ...prev, [fromClassId]: destValue }));
    // Sync default decisions for students in that class
    const inClass = studentsByClass[fromClassId] || [];
    setStudentDecisions((prev) => {
      const next = { ...prev };
      inClass.forEach((st) => {
        next[String(st.id)] = destValue === "GRADUATE" ? "graduate" : "promote";
      });
      return next;
    });
  };

  const handleExecute = async () => {
    if (!targetSessionId) {
      setError("Please select a target academic session.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const promotions = students
        .filter((s) => Boolean(s.current_class_id))
        .map((s) => {
          const fromId = String(s.current_class_id);
          const action = studentDecisions[String(s.id)] || "promote";
          const mappedDest = classMapping[fromId];
          return {
            student_id: Number(s.id),
            from_class_id: Number(fromId),
            to_class_id: action === "graduate" || mappedDest === "GRADUATE" ? null : Number(mappedDest || fromId),
            action,
          };
        });

      const res = await base44.functions.invoke("promoteStudents", {
        school_id: schoolId,
        source_session_id: sourceSessionId ? Number(sourceSessionId) : null,
        target_session_id: Number(targetSessionId),
        promotions,
      });
      const data = res?.data || res || {};
      setSummary(data);
      setStep(3);
      onCompleted?.(data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Failed to execute student promotion.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectCls = "h-9 px-3 rounded-lg border border-border bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-border overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-foreground">
                End-of-Session Class Promotion Wizard
              </h2>
              <p className="text-xs text-muted-foreground">
                Promote students to their next class, hold back repeating students, or graduate final-year classes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-2.5 bg-white border-b border-border/60 flex items-center gap-4 text-xs font-semibold">
          <span className={step === 1 ? "text-[hsl(var(--brand-indigo))]" : "text-muted-foreground"}>
            1. Sessions &amp; Class Map
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className={step === 2 ? "text-[hsl(var(--brand-indigo))]" : "text-muted-foreground"}>
            2. Review &amp; Hold-Back ({counts.total} Students)
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className={step === 3 ? "text-emerald-600" : "text-muted-foreground"}>
            3. Complete
          </span>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[68vh] overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading classes and students…
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-border">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Source Session (Current)</label>
                  <select className={selectCls + " w-full"} value={sourceSessionId} onChange={(e) => setSourceSessionId(e.target.value)}>
                    <option value="">Select source session…</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}{s.is_active ? " (Active)" : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Session (Next)</label>
                  <select className={selectCls + " w-full"} value={targetSessionId} onChange={(e) => setTargetSessionId(e.target.value)}>
                    <option value="">Select target session…</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}{s.is_active ? " (Active)" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[hsl(var(--brand-indigo))] font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Auto-suggested class progression (editable):
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-border text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Current Class</th>
                      <th className="px-4 py-2.5 text-center">Active Students</th>
                      <th className="px-4 py-2.5 text-left">Promote To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {classes.map((c) => {
                      const stuCount = (studentsByClass[String(c.id)] || []).length;
                      return (
                        <tr key={c.id}>
                          <td className="px-4 py-2.5 font-semibold text-foreground">{c.name}</td>
                          <td className="px-4 py-2.5 text-center text-muted-foreground">{stuCount}</td>
                          <td className="px-4 py-2.5">
                            <select
                              className={selectCls + " w-full sm:w-56"}
                              value={classMapping[String(c.id)] || "GRADUATE"}
                              onChange={(e) => updateMapping(String(c.id), e.target.value)}
                            >
                              {classes.map((dest) => (
                                <option key={dest.id} value={String(dest.id)}>{dest.name}</option>
                              ))}
                              <option value="GRADUATE">🎓 Graduated (Alumni)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              {/* Summary pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase">To Promote</p>
                  <p className="text-xl font-heading font-extrabold text-emerald-900">{counts.promote}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                  <p className="text-[11px] font-semibold text-amber-700 uppercase">Hold Back (Repeat)</p>
                  <p className="text-xl font-heading font-extrabold text-amber-900">{counts.repeat}</p>
                </div>
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-center">
                  <p className="text-[11px] font-semibold text-indigo-700 uppercase">Graduating</p>
                  <p className="text-xl font-heading font-extrabold text-indigo-900">{counts.graduate}</p>
                </div>
              </div>

              {classes.map((c) => {
                const list = studentsByClass[String(c.id)] || [];
                if (list.length === 0) return null;
                const destVal = classMapping[String(c.id)];
                const destName = destVal === "GRADUATE"
                  ? "Graduated"
                  : (classes.find((x) => String(x.id) === String(destVal))?.name || "Next Class");

                return (
                  <div key={c.id} className="border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 border-b border-border flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[hsl(var(--brand-indigo))]" />
                        {c.name} <ArrowRight className="w-3 h-3 text-muted-foreground" /> {destName}
                      </span>
                      <span className="text-muted-foreground font-medium">{list.length} student{list.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {list.map((st) => {
                        const decision = studentDecisions[String(st.id)] || "promote";
                        return (
                          <div key={st.id} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div>
                              <p className="font-semibold text-foreground">{st.full_name}</p>
                              <p className="text-muted-foreground font-mono">{st.admission_number || st.login_pin || ""}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setStudentDecisions((p) => ({ ...p, [String(st.id)]: "promote" }))}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                                  decision === "promote"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                Promote
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentDecisions((p) => ({ ...p, [String(st.id)]: "repeat" }))}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
                                  decision === "repeat"
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <RotateCcw className="w-3 h-3" /> Hold Back
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentDecisions((p) => ({ ...p, [String(st.id)]: "graduate" }))}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                                  decision === "graduate"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                Graduate
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-extrabold text-xl text-foreground">Promotion Complete!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {summary?.message || `Promoted ${summary?.promoted || 0}, held back ${summary?.repeated || 0}, graduated ${summary?.graduated || 0}.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border bg-slate-50">
          {step === 1 && (
            <>
              <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-border bg-white text-xs font-semibold">
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetSessionId || counts.total === 0}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg bg-[hsl(var(--brand-indigo))] text-white text-xs font-semibold disabled:opacity-50"
              >
                Review {counts.total} Students <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button type="button" onClick={() => setStep(1)} className="h-9 px-4 rounded-lg border border-border bg-white text-xs font-semibold">
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleExecute}
                className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {submitting ? "Promoting…" : "Confirm & Execute Promotion"}
              </button>
            </>
          )}
          {step === 3 && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-5 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
