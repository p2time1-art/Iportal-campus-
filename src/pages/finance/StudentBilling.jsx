import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Wallet, Loader2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import SearchInput from "@/components/admin/SearchInput";
import PaginationBar from "@/components/admin/PaginationBar";
import { formatCurrency, computeStudentBalance } from "@/lib/finance";

const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function StudentBilling() {
  const { schoolId } = useCurrentUser();
  const { sessions, terms, classes, loading: ctxLoading } = useAcademicContext(schoolId);
  const [students, setStudents] = useState([]);
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ session: "", term: "", class: "" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1, from: 0, to: 0 });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const chargeParams = {
        school_id: schoolId,
        academic_session_id: filters.session || undefined,
        term_id: filters.term || undefined,
      };
      const [stuRes, chg, pay] = await Promise.all([
        base44.entities.Student.paginate(
          {
            school_id: schoolId,
            status: "active",
            page,
            per_page: perPage,
            search: debouncedSearch || undefined,
            class_id: filters.class || undefined,
          },
          "full_name"
        ),
        base44.entities.StudentCharge.filter(chargeParams, "-created_date", 2000),
        base44.entities.Payment.filter(chargeParams, "-created_date", 2000),
      ]);
      setStudents(stuRes?.data || []);
      setMeta(stuRes?.meta || { current_page: page, per_page: perPage, total: 0, last_page: 1, from: 0, to: 0 });
      setCharges(chg || []);
      setPayments(pay || []);
    } catch (_e) {
      setStudents([]); setCharges([]); setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, page, perPage, debouncedSearch, filters]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    return students.map((s) => {
      const studentCharges = charges.filter((c) => c.student_id === s.id);
      const studentPayments = payments.filter((p) => p.student_id === s.id);
      const balance = computeStudentBalance(studentCharges, studentPayments);
      return { ...s, ...balance };
    });
  }, [students, charges, payments]);

  const totalOutstanding = rows.reduce((sum, s) => sum + s.outstanding, 0);
  const totalCollected = rows.reduce((sum, s) => sum + s.totalPaid, 0);

  return (
    <div>
      <AdminPageHeader title="Student Billing" subtitle="View outstanding balances and manage student financial accounts." icon={Wallet} />

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-4">
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select className={selectCls} value={filters.session} onChange={(e) => { setFilters({ ...filters, session: e.target.value, term: "" }); setPage(1); }}>
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={selectCls} value={filters.term} onChange={(e) => { setFilters({ ...filters, term: e.target.value }); setPage(1); }} disabled={!filters.session}>
            <option value="">All Terms</option>
            {terms.filter((t) => !filters.session || String(t.session_id) === String(filters.session)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className={selectCls} value={filters.class} onChange={(e) => { setFilters({ ...filters, class: e.target.value }); setPage(1); }}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, adm no, or PIN…" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Collected (This Page)</p>
          <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-green))] mt-1">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding (This Page)</p>
          <p className="text-xl font-heading font-extrabold text-[hsl(var(--brand-orange))] mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {loading || ctxLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Wallet} title="No students found" description="No active students match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Adm. No</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold text-right">Charges</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold text-right">Outstanding</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-medium text-foreground">{s.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.admission_number || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.current_class_name || "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(s.totalCharges)}</td>
                    <td className="px-4 py-3 text-right font-medium text-[hsl(var(--brand-green))]">{formatCurrency(s.totalPaid)}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(s.outstanding)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        s.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                        s.status === 'partially_paid' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                        s.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                        'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                        {s.status === 'paid' ? 'Paid' : s.status === 'partially_paid' ? 'Partial' : s.status === 'pending' ? 'Pending' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/app/billing/${s.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline">
                        Account <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar
          meta={meta}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          loading={loading}
        />
      </div>
    </div>
  );
}
