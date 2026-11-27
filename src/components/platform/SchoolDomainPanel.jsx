import React, { useState, useEffect } from "react";
import { Globe, Save, Loader2, CheckCircle2, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DOMAIN_STATUS_BADGES = {
  pending_dns: { label: "Pending DNS", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  verified: { label: "Verified", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export default function SchoolDomainPanel({ school, onUpdated }) {
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainStatus, setDomainStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!school) return;
    setSubdomain(school.subdomain || school.slug || "");
    setCustomDomain(school.custom_domain || "");
    setDomainStatus(school.domain_status || (school.custom_domain ? "pending_dns" : "active"));
  }, [school]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const updated = await base44.entities.School.update(school.id, {
        subdomain: subdomain.trim().toLowerCase(),
        slug: subdomain.trim().toLowerCase(),
        custom_domain: customDomain.trim().toLowerCase(),
        domain_status: domainStatus,
      });
      onUpdated?.(updated);
      setSavedMsg("Domain configuration updated.");
      setTimeout(() => setSavedMsg(""), 3500);
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Unable to update domain settings.");
    } finally {
      setSaving(false);
    }
  };

  const liveUrl =
    customDomain && domainStatus === "active"
      ? `https://${customDomain}`
      : subdomain
        ? `https://${subdomain}.iportalcampus.com`
        : "";

  const badge = DOMAIN_STATUS_BADGES[domainStatus] || DOMAIN_STATUS_BADGES.active;

  return (
    <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-foreground">
              Portal Subdomain &amp; Custom Domain
            </h3>
            <p className="text-xs text-muted-foreground">
              Assign and verify the school&apos;s portal address. School Admins see this as read-only.
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Platform Subdomain</label>
          <div className="flex items-center">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="greenfield"
              className="w-full h-10 px-3 rounded-l-lg bg-white border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
            />
            <span className="h-10 px-2.5 inline-flex items-center bg-slate-100 border border-l-0 border-border rounded-r-lg text-[11px] text-muted-foreground font-mono shrink-0">
              .iportalcampus.com
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Custom Domain (Optional)</label>
          <input
            type="text"
            value={customDomain}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().trim();
              setCustomDomain(val);
              if (val && !customDomain) setDomainStatus("pending_dns");
              if (!val) setDomainStatus("active");
            }}
            placeholder="portal.schoolname.edu.ng"
            className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Domain Status</label>
          <select
            value={domainStatus}
            onChange={(e) => setDomainStatus(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
          >
            <option value="pending_dns">Pending DNS</option>
            <option value="verified">Verified</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      {liveUrl && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-border px-4 py-2.5 text-xs">
          <div className="min-w-0">
            <span className="text-muted-foreground mr-2">Live Portal URL:</span>
            <span className="font-mono font-bold text-foreground break-all">{liveUrl}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(liveUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-white hover:bg-slate-100 text-foreground font-semibold"
            >
              <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
            </button>
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-white hover:bg-slate-100 text-[hsl(var(--brand-indigo))] font-semibold"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </a>
          </div>
        </div>
      )}

      {customDomain && domainStatus === "pending_dns" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900">
          <strong>DNS Verification Required:</strong> Instruct the school&apos;s IT admin to create a{" "}
          <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">CNAME</code> record for{" "}
          <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{customDomain}</code> pointing to{" "}
          <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">cname.iportalcampus.com</code>, then set status to{" "}
          <strong>Verified</strong> or <strong>Active</strong>.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-xs font-semibold disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Domain Assignment
        </button>
      </div>
    </form>
  );
}
