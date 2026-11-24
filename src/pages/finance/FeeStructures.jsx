import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ClipboardList, Pencil, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAcademicContext } from "@/hooks/useAcademicContext";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatCurrency } from "@/lib/finance";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";
const selectCls = "w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function FeeStructures() {
  const { schoolId } = useCurrentUser();
  const { sessions, terms, classes, loading: ctxLoading } = useAcademicContext(schoolId);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ session: "", term: "", class: "", status: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ academic_session_id: "", term_id: "", class_id: "", fee_category_id: "", amount: "", compulsory: true, due_date: "", description: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const cats = await base44.entities.FeeCategory.filter({ school_id: schoolId, status: "active" }, "name", 200);
      setCategories(cats || []);
    })();
  }, [schoolId]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const query = { school_id: schoolId };
      if (filters.session) query.academic_session_id = filters.session;
      if (filters.term) query.term_id = filters.term;
      if (filters.class) query.class_id = filters.class;
      if (filters.status) query.status = filters.status;
      const data = await base44.entities.FeeStructure.filter(query, "-created_date", 500);
      setItems(data || []);
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, filters]);

  useEffect(() => { load(); }, [load]);

  const sessionTerms = useMemo(() => terms.filter((t) => String(t.session_id) === String(form.academic_session_id)), [terms, form.academic_session_id]);

  const openAdd = () => {
    setEditing(null);
    setForm({ academic_session_id: "", term_id: "", class_id: "", fee_category_id: "", amount: "", compulsory: true, due_date: "", description: "", status: "active" });
    setFormError("");
    setDrawerOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      academic_session_id: item.academic_session_id || "", term_id: item.term_id || "", class_id: item.class_id || "",
      fee_category_id: item.fee_category_id || "", amount: String(item.amount || ""), compulsory: item.compulsory !== false,
      due_date: item.due_date || "", description: item.description || "", status: item.status || "active"
    });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.academic_session_id) { setFormError("Academic session is required."); return; }
    if (!form.fee_category_id) { setFormError("Fee category is required."); return; }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { setFormError("Amount must be a positive number."); return; }

    // Duplicate check: same school + session + term + class + category
    const dupQuery = { school_id: schoolId, academic_session_id: form.academic_session_id, fee_category_id: form.fee_category_id };
    if (form.term_id) dupQuery.term_id = form.term_id;
    if (form.class_id) dupQuery.class_id = form.class_id;
    const existing = await base44.entities.FeeStructure.filter(dupQuery, "-created_date", 50);
    const dup = (existing || []).find((e) => e.id !== editing?.id);
    if (dup) { setFormError("A fee structure already exists for this session/term/class/category combination."); return; }

    setSaving(true); setFormError("");
    try {
      const sessionName = sessions.find((s) => s.id === form.academic_session_id)?.name || "";
      const termName = terms.find((t) => t.id === form.term_id)?.name || "";
      const className = classes.find((c) => c.id === form.class_id)?.name || "";
      const catName = categories.find((c) => c.id === form.fee_category_id)?.name || "";
      const payload = {
        school_id: schoolId,
        academic_session_id: form.academic_session_id,
        session_name: sessionName,
        term_id: form.term_id || "",
        term_name: termName,
        class_id: form.class_id || "",
        class_name: className,
        fee_category_id: form.fee_category_id,
        category_name: catName,
        amount: amt,
        compulsory: form.compulsory,
        due_date: form.due_date || "",
        description: form.description || "",
        status: form.status
      };
      if (editing) {
        await base44.entities.FeeStructure.update(editing.id, payload);
      } else {
        await base44.entities.FeeStructure.create(payload);
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      setFormError(err?.message || "Unable to save fee structure.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.FeeStructure.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (_e) {
      setFormError("Unable to delete fee structure.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Fee Structures" subtitle="Define what your school charges per session, term, class, and category." actionLabel="Add Fee Structure" onAction={openAdd} icon={ClipboardList} />

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-4">
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select className={selectCls} value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value, term: "" })}>
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={selectCls} value={filters.term} onChange={(e) => setFilters({ ...filters, term: e.target.value })} disabled={!filters.session}>
            <option value="">All Terms</option>
            {terms.filter((t) => !filters.session || String(t.session_id) === String(filters.session)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className={selectCls} value={filters.class} onChange={(e) => setFilters({ ...filters, class: e.target.value })}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={selectCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {loading || ctxLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No fee structures yet" description="Create fee structures to define what each class pays per session and term." actionLabel="Add Fee Structure" onAction={openAdd} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 font-semibold">Term</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Compulsory</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 text-foreground">{s.session_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.term_name || "All Terms"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.class_name || "All Classes"}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{s.category_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(s.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.compulsory ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.due_date || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Fee Structure" : "Add Fee Structure"}
        description={editing ? "Update fee structure details." : "Create a new fee structure."}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setDrawerOpen(false)} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Academic Session *</label>
            <select className={inputCls} value={form.academic_session_id} onChange={(e) => setForm({ ...form, academic_session_id: e.target.value, term_id: "" })}>
              <option value="">Select session…</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Term (optional — leave empty for per-session)</label>
            <select className={inputCls} value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })} disabled={!form.academic_session_id}>
              <option value="">All Terms</option>
              {sessionTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Class (optional — leave empty for all classes)</label>
            <select className={inputCls} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Fee Category *</label>
            <select className={inputCls} value={form.fee_category_id} onChange={(e) => setForm({ ...form, fee_category_id: e.target.value })}>
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Amount (₦) *</label>
            <input type="number" min="0" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 120000" />
          </div>
          <div>
            <label className={labelCls}>Due Date</label>
            <input type="date" className={inputCls} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="compulsory" checked={form.compulsory} onChange={(e) => setForm({ ...form, compulsory: e.target.checked })} className="w-4 h-4 rounded border-border" />
            <label htmlFor="compulsory" className="text-sm font-medium text-foreground">Compulsory fee</label>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>}
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete fee structure?"
        message={`Are you sure you want to delete the ${deleteTarget?.category_name} fee structure? This cannot be undone.`}
      />
    </div>
  );
}