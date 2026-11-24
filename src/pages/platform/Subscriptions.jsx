import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, CreditCard, Pencil, RefreshCw, Ban, CheckCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import SubscriptionFormDrawer from "@/components/platform/SubscriptionFormDrawer";

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, schs] = await Promise.all([
        base44.entities.Subscription.list("-created_date", 500),
        base44.entities.School.list("-created_date", 500)
      ]);
      setSubscriptions(subs || []);
      setSchools(schs || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = subscriptions.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.school_name?.toLowerCase().includes(q);
    const matchPlan = !planFilter || s.plan_name === planFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const handleSave = async (form) => {
    if (editSub) {
      await base44.functions.invoke("manageSubscription", { action: "update", subscription_id: editSub.id, ...form });
    } else {
      await base44.functions.invoke("manageSubscription", { action: "create", ...form });
    }
    load();
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const { action, sub } = confirm;
      if (action === "suspend") await base44.functions.invoke("manageSubscription", { action: "suspend", subscription_id: sub.id });
      else if (action === "cancel") await base44.functions.invoke("manageSubscription", { action: "cancel", subscription_id: sub.id });
      else if (action === "activate") await base44.functions.invoke("manageSubscription", { action: "activate", subscription_id: sub.id });
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
        title="Subscriptions"
        subtitle="Manage school subscription plans and billing"
        actionLabel="Create Subscription"
        onAction={() => { setEditSub(null); setDrawerOpen(true); }}
        icon={Plus}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by school name…" />
        <select className={selectCls + " sm:w-44"} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="">All Plans</option>
          <option value="free_trial">Free Trial (14d / 10 max)</option>
          <option value="standard">Standard (250 Students)</option>
          <option value="premium">Premium (Unlimited)</option>
        </select>
        <select className={selectCls + " sm:w-40"} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions found" description={search || planFilter || statusFilter ? "Try adjusting your filters" : "Create the first subscription for a school"} actionLabel="Create Subscription" onAction={() => { setEditSub(null); setDrawerOpen(true); }} />
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 hidden md:table-cell">Start</th>
                  <th className="px-4 py-3 hidden md:table-cell">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{s.school_name || "—"}</td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground capitalize">{s.plan_name}</span></td>
                    <td className="px-4 py-3 font-semibold">{fmtNaira(s.amount)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{s.start_date || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{s.expiry_date || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditSub(s); setDrawerOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="w-4 h-4" /></button>
                        {s.status === "active" ? (
                          <button onClick={() => setConfirm({ action: "suspend", sub: s, message: `Suspend subscription for ${s.school_name}?` })} className="p-2 rounded-lg hover:bg-orange-50 text-muted-foreground hover:text-orange-600" title="Suspend"><Ban className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => setConfirm({ action: "activate", sub: s, message: `Activate subscription for ${s.school_name}?` })} className="p-2 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600" title="Activate"><CheckCircle className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => setConfirm({ action: "cancel", sub: s, message: `Cancel subscription for ${s.school_name}? This action cannot be undone.` })} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Cancel"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SubscriptionFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={handleSave} schools={schools} subscription={editSub} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "suspend" ? "Suspend Subscription" : confirm?.action === "cancel" ? "Cancel Subscription" : "Activate Subscription"}
        message={confirm?.message}
        confirmLabel={confirm?.action === "suspend" ? "Suspend" : confirm?.action === "cancel" ? "Cancel" : "Activate"}
        onConfirm={handleConfirm}
        loading={processing}
      />
    </div>
  );
}