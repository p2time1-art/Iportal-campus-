import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ResultStatusBadge from "@/components/academic/ResultStatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { FileBarChart, Loader2, Check, X, Send, Lock, Unlock, Plus, Award, Trophy } from "lucide-react";
import { apiRequest } from "@/api/client";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function AdminResults() {
  const { user, schoolId } = useCurrentUser();
  const { sessions, terms, classes, subjects, loading: ctxLoading } = useAcademicContext(schoolId);

  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [acting, setActing] = useState(false);
  const [rankingResult, setRankingResult] = useState(null);

  const sessionTerms = useMemo(() => terms.filter((t) => String(t.session_id) === String(sessionId)), [terms, sessionId]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const query = { school_id: schoolId };
      if (sessionId) query.session_id = sessionId;
      if (termId) query.term_id = termId;
      if (classId) query.class_id = classId;
      if (subjectId) query.subject_id = subjectId;
      if (statusFilter) query.status = statusFilter;
      const data = await base44.entities.Result.filter(query, "-created_date", 500);
      setResults(data || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [schoolId, sessionId, termId, classId, subjectId, statusFilter]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const openReview = (r) => { setSelected(r); setReviewNote(""); };

  const actOnResult = async (action) => {
    if (!selected) return;
    setActing(true);
    try {
      const now = new Date().toISOString();
      const updates = { review_note: reviewNote };
      if (action === "approve") { updates.status = "approved"; updates.approved_at = now; updates.approved_by_id = user.id; }
      if (action === "reject") { updates.status = "rejected"; updates.rejected_at = now; }
      if (action === "publish") { updates.status = "published"; updates.published_at = now; updates.published_by_id = user.id; }
      if (action === "unpublish") { updates.status = "approved"; updates.published_at = null; updates.published_by_id = null; }
      if (action === "reopen") { updates.status = "submitted"; updates.approved_at = null; updates.approved_by_id = null; }
      await base44.entities.Result.update(selected.id, updates);
      if (action === "publish") {
        await computeAndStorePositions(selected.class_id, selected.session_id, selected.term_id);
      }
      setSelected(null);
      loadResults();
    } catch (_e) {
      // non-fatal
    } finally {
      setActing(false);
    }
  };

  // Backend Term Result Computation & Ranking Engine:
  // Computes per-subject positions, subject class averages, aggregate totals/averages,
  // and overall class positions (with 1st, 2nd, 2nd, 4th tie-handling) atomically.
  const computeAndStorePositions = async (targetClassId, _targetSessionId, targetTermId, publishAll = false) => {
    if (!targetClassId || !targetTermId) return null;
    try {
      const res = await apiRequest("/v1/results/compute-rankings", {
        method: "POST",
        body: {
          school_id: schoolId,
          class_id: Number(targetClassId),
          term_id: Number(targetTermId),
          publish_all: publishAll,
        },
      });
      const summary = res?.data || res;
      setRankingResult(summary);
      return summary;
    } catch (_e) {
      return null;
    }
  };

  const bulkAction = async (action) => {
    setActing(true);
    try {
      const now = new Date().toISOString();
      const ids = results.map((r) => r.id);
      if (ids.length === 0) return;
      const updates = {};
      if (action === "approve") { updates.status = "approved"; updates.approved_at = now; updates.approved_by_id = user.id; }
      if (action === "publish") { updates.status = "published"; updates.published_at = now; updates.published_by_id = user.id; }
      await base44.entities.Result.bulkUpdate(ids.map((id) => ({ id, ...updates })));
      if (action === "publish") {
        const combos = {};
        results.forEach((r) => {
          const key = `${r.class_id}|${r.session_id}|${r.term_id}`;
          combos[key] = { class_id: r.class_id, session_id: r.session_id, term_id: r.term_id };
        });
        await Promise.all(Object.values(combos).map((c) => computeAndStorePositions(c.class_id, c.session_id, c.term_id)));
      }
      loadResults();
    } catch (_e) {
      // non-fatal
    } finally {
      setActing(false);
    }
  };

  if (ctxLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <AdminPageHeader
        title="Result Review"
        subtitle="Review, approve, and publish submitted results."
        actionLabel="Enter Results"
        onAction={() => window.location.href = "/app/result-entry"}
        icon={Plus}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              {sessionTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Class</label>
            <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <select className={selectCls} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk actions & Automatic Ranking Engine */}
      {(results.length > 0 || (classId && termId)) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {statusFilter === "submitted" && results.length > 0 && (
            <button onClick={() => bulkAction("approve")} disabled={acting} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
              <Check className="w-4 h-4" /> Approve All ({results.length})
            </button>
          )}
          {statusFilter === "approved" && results.length > 0 && (
            <button onClick={() => bulkAction("publish")} disabled={acting} className="h-9 px-4 rounded-lg bg-[hsl(var(--brand-indigo))] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              <Send className="w-4 h-4" /> Publish &amp; Rank All ({results.length})
            </button>
          )}
          {classId && termId && (
            <button
              onClick={async () => {
                setActing(true);
                await computeAndStorePositions(classId, sessionId, termId, true);
                await loadResults();
                setActing(false);
              }}
              disabled={acting}
              className="h-9 px-4 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
            >
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              Compute &amp; Publish Class Positions
            </button>
          )}
        </div>
      )}

      {/* Computed Class Ranking Leaderboard */}
      {rankingResult && (rankingResult.leaderboard || []).length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <h4 className="font-heading font-bold text-sm text-emerald-950">
                Computed Class Positions ({rankingResult.ranked_students} Students · {rankingResult.ranked_subjects} Subjects)
              </h4>
            </div>
            <button onClick={() => setRankingResult(null)} className="text-xs font-semibold text-emerald-700 hover:underline">
              Dismiss
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {rankingResult.leaderboard.slice(0, 8).map((row) => (
              <div key={row.student_id} className="bg-white rounded-lg border border-emerald-200/70 px-3 py-2 flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{row.student_name}</p>
                  <p className="text-[11px] text-muted-foreground">Avg: {row.overall_average}% · Total: {row.overall_total}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold shrink-0 ml-2">
                  {row.class_position_ordinal}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : results.length === 0 ? (
        <EmptyState icon={FileBarChart} title="No results found" description="No results match the selected filters. Adjust your filters or wait for teachers to submit results." />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Term</th>
                  <th className="px-4 py-3 font-semibold text-center">Total</th>
                  <th className="px-4 py-3 font-semibold text-center">Grade</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 1 ? "bg-secondary/20" : ""}>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.student_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.class_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.subject_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.term_name}</td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">{r.total_score}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] font-bold text-xs">{r.grade || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-center"><ResultStatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openReview(r)} className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelected(null)} />
          <div className="fixed right-0 inset-y-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <h2 className="font-heading font-bold text-base text-foreground">Review Result</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-sm font-semibold">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Student</p>
                <p className="font-semibold text-foreground">{selected.student_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Class</p><p className="text-sm font-medium">{selected.class_name}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Subject</p><p className="text-sm font-medium">{selected.subject_name}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Term</p><p className="text-sm font-medium">{selected.term_name}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Teacher</p><p className="text-sm font-medium">{selected.teacher_name || "—"}</p></div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Scores</p>
                <div className="space-y-1.5">
                  {Object.entries(selected.components || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key}</span>
                      <span className="font-semibold text-foreground">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div className="text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-foreground">{selected.total_score}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Grade</p><p className="text-xl font-bold text-[hsl(var(--brand-indigo))]">{selected.grade}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><ResultStatusBadge status={selected.status} /></div></div>
              </div>
              {selected.review_note && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-1">Previous review note:</p>
                  <p className="text-sm text-red-600">{selected.review_note}</p>
                </div>
              )}
              {selected.status === "submitted" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Review note (optional for approval, required for rejection)</label>
                  <textarea className="w-full p-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Feedback for the teacher…" />
                </div>
              )}
            </div>
            <div className="border-t border-border p-4 flex flex-wrap gap-2 shrink-0">
              {selected.status === "submitted" && (
                <>
                  <button onClick={() => actOnResult("reject")} disabled={acting} className="flex-1 min-w-[120px] h-10 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Return
                  </button>
                  <button onClick={() => actOnResult("approve")} disabled={acting} className="flex-1 min-w-[120px] h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                  </button>
                </>
              )}
              {selected.status === "approved" && (
                <>
                  <button onClick={() => actOnResult("reopen")} disabled={acting} className="flex-1 min-w-[100px] h-10 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50 flex items-center justify-center gap-2">
                    <Unlock className="w-4 h-4" /> Reopen
                  </button>
                  <button onClick={() => actOnResult("publish")} disabled={acting} className="flex-1 min-w-[100px] h-10 rounded-lg bg-[hsl(var(--brand-indigo))] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish
                  </button>
                </>
              )}
              {selected.status === "published" && (
                <button onClick={() => actOnResult("unpublish")} disabled={acting} className="flex-1 h-10 rounded-lg border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" /> Unpublish
                </button>
              )}
              {selected.status === "rejected" && (
                <p className="text-sm text-muted-foreground w-full text-center">Returned to teacher for correction. Awaiting resubmission.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}