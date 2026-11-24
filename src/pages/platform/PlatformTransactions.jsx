import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Wallet, CheckCircle, Undo2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import PlatformTransactionDrawer from "@/components/platform/PlatformTransactionDrawer";

export default function PlatformTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txns, schs, subs] = await Promise.all([
        base44.entities.PlatformTransaction.list("-created_date", 500),
        base44.entities.School.list("-created_date", 500),
        base44.entities.Subscription.list("-created_date", 500)
      ]);
      setTransactions(txns || []);
      setSchools(schs || []);
      setSubscriptions(subs || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.school_name?.toLowerCase().includes(q) ||
      t.external_reference?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchSchool = !schoolFilter || t.school_id === schoolFilter;
    return matchSearch && matchStatus && matchSchool;
  });

  const totalSuccessful = filtered.filter(t => t.status === "successful").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPending = filtered.filter(t => t.status === "pending").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleSave = async (form) => {
    await base44.functions.invoke("managePlatformTransaction", { action: "create", ...form });
    load();
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const { action, txn } = confirm;
      if (action === "verify") await base44.functions.invoke("managePlatformTransaction", { action: "verify", transaction_id: txn.id });
      else if (action === "reverse") await base44.functions.invoke("managePlatformTransaction", { action: "reverse", transaction_id: txn.id });
      load();
    } catch (_e) {
      // non-fatal
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  const selectCls = "h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
  const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

  return (
    <div>
      <AdminPageHeader
        title="Platform Transactions"
        subtitle="School subscription payments and platform-level financial records"
        actionLabel="Record Transaction"
        onAction={() => setDrawerOpen(true)}
        icon={Plus}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">Successful</p>
          <p className="text-lg font-heading font-bold text-[hsl(var(--brand-green))]">{fmtNaira(totalSuccessful)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-heading font-bold text-[hsl(var(--brand-orange))]">{fmtNaira(totalPending)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">Total Records</p>
          <p className="text-lg font-heading font-bold text-foreground">{filtered.length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by school or reference…" />
        <select className={selectCls + " sm:w-48"} value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}>
          <option value="">All Schools</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={selectCls + " sm:w-40"} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="reversed">Reversed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions found" description={search || statusFilter || schoolFilter ? "Try adjusting your filters" : "Record the first platform transaction"} actionLabel="Record Transaction" onAction={() => setDrawerOpen(true)} />
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 hidden md:table-cell">Method</th>
                  <th className="px-4 py-3 hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Reference</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{t.school_name || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{fmtNaira(t.amount)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground capitalize">{t.payment_method?.replace("_", " ") || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{t.transaction_date || "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs truncate max-w-[150px]">{t.external_reference || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {t.status === "pending" && (
                          <button onClick={() => setConfirm({ action: "verify", txn: t, message: `Verify this transaction of ${fmtNaira(t.amount)} for ${t.school_name}?` })} className="p-2 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600" title="Verify"><CheckCircle className="w-4 h-4" /></button>
                        )}
                        {t.status === "successful" && (
                          <button onClick={() => setConfirm({ action: "reverse", txn: t, message: `Reverse this transaction of ${fmtNaira(t.amount)} for ${t.school_name}? This will restore the previous status.` })} className="p-2 rounded-lg hover:bg-orange-50 text-muted-foreground hover:text-orange-600" title="Reverse"><Undo2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PlatformTransactionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={handleSave} schools={schools} subscriptions={subscriptions} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "verify" ? "Verify Transaction" : "Reverse Transaction"}
        message={confirm?.message}
        confirmLabel={confirm?.action === "verify" ? "Verify" : "Reverse"}
        onConfirm={handleConfirm}
        loading={processing}
      />
    </div>
  );
}