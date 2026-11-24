import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Building2, Pencil, Ban, CheckCircle, Eye } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import SchoolFormDrawer from "@/components/platform/SchoolFormDrawer";

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editSchool, setEditSchool] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [gatewayConfigs, setGatewayConfigs] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, configs] = await Promise.all([
        base44.entities.School.list("-created_date", 500),
        base44.entities.PaymentGatewayConfig.list("-created_date", 500).catch(() => [])
      ]);
      setSchools(list || []);
      setGatewayConfigs(configs || []);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = schools.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.name?.toLowerCase().includes(q) ||
      s.school_code?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSaveSchool = async (form) => {
    if (editSchool) {
      await base44.functions.invoke("manageSchool", { action: "update", school_id: editSchool.id, ...form });
    } else {
      await base44.functions.invoke("manageSchool", { action: "create", ...form });
    }
    load();
  };

  const handleStatusChange = async (school, newStatus) => {
    setProcessing(true);
    try {
      await base44.functions.invoke("manageSchool", { action: newStatus === "suspended" ? "suspend" : newStatus === "active" ? "activate" : "deactivate", school_id: school.id });
      load();
    } catch (_e) {
      // non-fatal
    } finally {
      setProcessing(false);
      setConfirm(null);
    }
  };

  const selectCls = "h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

  return (
    <div>
      <AdminPageHeader
        title="Schools"
        subtitle="Manage all registered schools on the platform"
        actionLabel="Add School"
        onAction={() => { setEditSchool(null); setDrawerOpen(true); }}
        icon={Plus}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, or email…" />
        <select className={selectCls + " sm:w-40"} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No schools found" description={search || statusFilter ? "Try adjusting your filters" : "Register the first school on the platform"} actionLabel="Add School" onAction={() => { setEditSchool(null); setDrawerOpen(true); }} />
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Gateway</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/app/schools/${s.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-indigo))] flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {s.name?.split(" ").map(p => p[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-semibold text-foreground hover:text-[hsl(var(--brand-indigo))]">{s.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.school_code || s.short_name || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {s.email || s.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground capitalize">{s.plan}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(() => {
                        const cfg = gatewayConfigs.find(c => c.school_id === s.id);
                        if (!cfg || !cfg.has_credentials) return <span className="text-xs text-muted-foreground">—</span>;
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">Paystack</span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${cfg.enabled ? 'bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]' : 'bg-gray-100 text-gray-500'}`}>
                              {cfg.enabled ? '✓ Active' : 'Disabled'}
                            </span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {s.created_date ? new Date(s.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/app/schools/${s.id}`} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" title="View"><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => { setEditSchool(s); setDrawerOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="w-4 h-4" /></button>
                        {s.status === "active" ? (
                          <button onClick={() => setConfirm({ school: s, action: "suspended", message: `Suspend "${s.name}"? The school will lose platform access but all data is preserved.` })} className="p-2 rounded-lg hover:bg-orange-50 text-muted-foreground hover:text-orange-600" title="Suspend"><Ban className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => setConfirm({ school: s, action: "active", message: `Activate "${s.name}"? The school will regain platform access.` })} className="p-2 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600" title="Activate"><CheckCircle className="w-4 h-4" /></button>
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

      <SchoolFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={handleSaveSchool} school={editSchool} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "suspended" ? "Suspend School" : "Activate School"}
        message={confirm?.message}
        confirmLabel={confirm?.action === "suspended" ? "Suspend" : "Activate"}
        onConfirm={() => handleStatusChange(confirm.school, confirm.action)}
        loading={processing}
      />
    </div>
  );
}