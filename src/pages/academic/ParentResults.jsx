import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import EmptyState from "@/components/admin/EmptyState";
import { FileBarChart, Loader2, ChevronDown, Check } from "lucide-react";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function ParentResults() {
  const { user, schoolId } = useCurrentUser();
  const { sessions: ctxSessions, terms: ctxTerms } = useAcademicContext(schoolId);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const loadChildren = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await base44.functions.invoke("getParentContext", {});
      const data = res?.data || res;
      setChildren(data?.children || []);
      if ((data?.children || []).length > 0) setSelectedChild(data.children[0]);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadResults = useCallback(async (childId) => {
    if (!childId) return;
    setLoadingResults(true);
    try {
      const res = await base44.functions.invoke("getParentContext", { student_id: childId });
      const data = res?.data || res;
      setResults(data?.results || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => { loadChildren(); }, [loadChildren]);
  useEffect(() => { if (selectedChild) loadResults(selectedChild.id); }, [selectedChild, loadResults]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (children.length === 0) {
    return (
      <div>
        <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight mb-6">Results</h1>
        <EmptyState icon={FileBarChart} title="No linked children" description="You do not have any students linked to your account. Please contact your school to be linked as a guardian." />
      </div>
    );
  }

  const sessions = useMemo(() => {
    if (ctxSessions && ctxSessions.length > 0) return ctxSessions;
    return [...new Set(results.map((r) => JSON.stringify({ id: r.session_id, name: r.session_name })))].map((s) => JSON.parse(s));
  }, [ctxSessions, results]);

  const terms = useMemo(() => {
    if (ctxTerms && ctxTerms.length > 0) {
      return ctxTerms.filter((t) => !sessionId || String(t.session_id) === String(sessionId));
    }
    return [...new Set(results.filter((r) => !sessionId || String(r.session_id) === String(sessionId)).map((r) => JSON.stringify({ id: r.term_id, name: r.term_name })))].map((s) => JSON.parse(s));
  }, [ctxTerms, results, sessionId]);

  const filtered = results.filter((r) => (!sessionId || String(r.session_id) === String(sessionId)) && (!termId || String(r.term_id) === String(termId)));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">Results</h1>
          <p className="text-sm text-muted-foreground mt-1">View published results for your children.</p>
        </div>
        {/* Child selector */}
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 h-11 px-4 rounded-xl border border-border bg-white text-left hover:bg-secondary min-w-[220px]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(200_80%_50%)] to-[hsl(222_47%_25%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(selectedChild?.full_name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{selectedChild?.full_name}</p>
              <p className="text-xs text-muted-foreground">{selectedChild?.current_class_name || ""}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-border py-2 z-20">
              {children.map((c) => (
                <button key={c.id} onClick={() => { setSelectedChild(c); setDropdownOpen(false); setSessionId(""); setTermId(""); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(200_80%_50%)] to-[hsl(222_47%_25%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground">{c.current_class_name}</p>
                  </div>
                  {selectedChild?.id === c.id && <Check className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loadingResults ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : results.length === 0 ? (
        <EmptyState icon={FileBarChart} title="No published results yet" description={`${selectedChild?.full_name}'s results will appear here once published by the school.`} />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Session</label>
                <select className={selectCls} value={sessionId} onChange={(e) => { setSessionId(e.target.value); setTermId(""); }}>
                  <option value="">All sessions</option>
                  {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Term</label>
                <select className={selectCls} value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!sessionId}>
                  <option value="">All terms</option>
                  {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-semibold">Subject</th>
                    <th className="px-4 py-3 font-semibold text-center">Total</th>
                    <th className="px-4 py-3 font-semibold text-center">Grade</th>
                    <th className="px-4 py-3 font-semibold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 1 ? "bg-secondary/20" : ""}>
                      <td className="px-4 py-3 font-medium text-foreground">{r.subject_name}</td>
                      <td className="px-4 py-3 text-center font-bold">{r.total_score}<span className="text-muted-foreground font-normal">/{r.max_total}</span></td>
                      <td className="px-4 py-3 text-center"><span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))] font-bold text-xs">{r.grade}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{r.remark || "—"}</td>
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