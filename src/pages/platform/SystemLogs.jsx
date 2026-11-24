import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ScrollText } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import PaginationBar from "@/components/admin/PaginationBar";
import EmptyState from "@/components/admin/EmptyState";

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 25, total: 0, last_page: 1, from: 0, to: 0 });
  const [knownActions, setKnownActions] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.AuditLog.paginate(
        {
          page,
          per_page: perPage,
          search: debouncedSearch || undefined,
          action: actionFilter || undefined,
        },
        "-created_date"
      );
      const rows = res?.data || [];
      setLogs(rows);
      setMeta(res?.meta || { current_page: page, per_page: perPage, total: 0, last_page: 1, from: 0, to: 0 });
      setKnownActions((prev) => {
        const merged = new Set([...prev, ...rows.map((l) => l.action).filter(Boolean)]);
        return [...merged].sort();
      });
    } catch (_e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const selectCls = "h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

  return (
    <div>
      <AdminPageHeader title="System Logs" subtitle="Immutable audit trail of platform-level administrative actions" />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by action, description, actor, or school…" />
        <select className={selectCls + " sm:w-56"} value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {knownActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit logs found" description={search || actionFilter ? "Try adjusting your filters" : "No administrative actions have been recorded yet"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 hidden md:table-cell">Actor</th>
                  <th className="px-4 py-3 hidden lg:table-cell">School</th>
                  <th className="px-4 py-3 hidden md:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--brand-violet))]/10 text-[hsl(var(--brand-violet))] whitespace-nowrap">{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{l.description || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      <p className="font-medium">{l.actor_name || "—"}</p>
                      <p className="text-xs">{l.actor_role || ""}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{l.school_name || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs whitespace-nowrap">
                      {l.created_date ? new Date(l.created_date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
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
