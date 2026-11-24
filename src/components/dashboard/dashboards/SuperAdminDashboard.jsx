import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  GraduationCap,
  Users,
  Wallet,
  ShieldCheck,
  ScrollText,
  ArrowRight,
  AlertTriangle,
  CreditCard,
  UserCog,
  FileBarChart,
  Crown,
  Server,
  Activity,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import StatCard from "./StatCard";
import FormDrawer from "@/components/admin/FormDrawer";
import { useRpcQuery, useApiV1Query, useApiV1Mutation } from "@/hooks/useIportalQuery";
import { apiRequest } from "@/api/client";
import { schoolOnboardingSchema, applyLaravelValidationErrors } from "@/lib/laravelValidation";

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-xs font-semibold text-foreground mb-1 block uppercase tracking-wide";

export default function SuperAdminDashboard() {
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState("");
  const [serverFormError, setServerFormError] = useState("");

  const {
    data: platformData,
    isLoading: loadingStats,
    error: statsError,
  } = useRpcQuery(["platform-stats"], "getPlatformStats", {});

  const { data: pipelineData } = useApiV1Query(["pipeline-status-platform"], "/pipeline/status");

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schoolOnboardingSchema),
    defaultValues: {
      name: "",
      short_name: "",
      slug: "",
      email: "",
      phone: "",
      city: "Lagos",
      plan: "standard",
      primary_color: "#0f172a",
    },
  });

  const onboardMutation = useApiV1Mutation(
    (payload) => apiRequest("/v1/schools", { method: "POST", body: payload }),
    [["platform-stats"]]
  );

  const onSubmitOnboarding = async (values) => {
    setServerFormError("");
    setOnboardSuccess("");
    try {
      const created = await onboardMutation.mutateAsync({
        ...values,
        status: "active",
      });
      setOnboardSuccess(`School "${created?.name || values.name}" onboarded with ${values.plan.toUpperCase()} tier!`);
      reset();
      setTimeout(() => {
        setOnboardOpen(false);
        setOnboardSuccess("");
      }, 1400);
    } catch (err) {
      const msg = applyLaravelValidationErrors(err, setError);
      setServerFormError(msg);
    }
  };

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground">{statsError.message || "Failed to load platform data"}</p>
      </div>
    );
  }

  const { stats, serverHealth, recentSchools, recentActivity } = platformData || {};
  const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

  const quickActions = [
    { label: "Onboard School", icon: Plus, onClick: () => setOnboardOpen(true) },
    { label: "Manage Schools", icon: Building2, path: "/app/schools" },
    { label: "Administrators", icon: UserCog, path: "/app/administrators" },
    { label: "Platform Users", icon: Users, path: "/app/users" },
    { label: "Tenant Billing", icon: CreditCard, path: "/app/subscriptions" },
    { label: "Split Revenue", icon: Wallet, path: "/app/platform-transactions" },
    { label: "Platform Analytics", icon: FileBarChart, path: "/app/platform-reports" },
    { label: "System & Audit Logs", icon: ScrollText, path: "/app/system-logs" },
  ];

  const watchedName = watch("name");

  return (
    <div className="space-y-6">
      {/* Header banner with Onboard Tenant CTA */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(263 70% 50%), hsl(243 75% 59%))" }}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-white/70" />
              <p className="text-white/70 text-sm">Super Admin SaaS Control Plane</p>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl mb-2">iPortal Campus Platform</h2>
            <p className="text-white/80 max-w-xl">
              Oversee multi-tenant school billing, platform convenience fee splits, server &amp; Horizon queue health, and instant tenant onboarding.
            </p>
          </div>
          <button
            onClick={() => setOnboardOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white text-[hsl(var(--brand-navy))] hover:bg-white/90 text-sm font-bold shadow-lg shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" /> Onboard New School
          </button>
        </div>
      </div>

      {/* Platform Analytics & Tenant Billing KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Tenant Schools"
          value={stats?.totalSchools ?? 0}
          sub={`${stats?.activeSchools ?? 0} active · ${stats?.suspendedSchools ?? 0} suspended`}
          color="indigo"
        />
        <StatCard
          icon={GraduationCap}
          label="Platform Students"
          value={stats?.totalStudents ?? 0}
          sub={`${stats?.totalTeachers ?? 0} teachers · ${stats?.totalParents ?? 0} parents`}
          color="orange"
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={stats?.activeSubscriptions ?? 0}
          sub={`Sub Revenue: ${fmtNaira(stats?.subscriptionRevenue ?? stats?.platformRevenue ?? 0)}`}
          color="green"
        />
        <StatCard
          icon={Wallet}
          label="Total SaaS Revenue"
          value={fmtNaira(stats?.platformRevenue ?? 0)}
          sub={`₦100 Fee Splits: ${fmtNaira(stats?.splitRevenue ?? 0)}`}
          color="navy"
        />
      </div>

      {/* Tenant Billing, Gateway Volume & Server Health Strip */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Server & Queue Pipeline Health Card */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              <h3 className="font-heading font-bold text-base text-foreground">Server &amp; Queue Health</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
              <Activity className="w-3.5 h-3.5" /> Operational
            </span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Database Cluster</span>
              <span className="font-semibold text-foreground">{serverHealth?.database || "MySQL 3306 Connected"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Queue &amp; Horizon</span>
              <span className="font-semibold text-emerald-700">
                {serverHealth?.queueDriver || "REDIS"} · {serverHealth?.horizonConfigured ? "Horizon Ready" : "Active"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">PDF Engine</span>
              <span className="font-semibold text-foreground">{serverHealth?.pdfEngine || "Dompdf v3.1"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Messaging Gateways</span>
              <span className="font-semibold text-foreground uppercase">
                {pipelineData?.email_provider || "Postmark"} / {pipelineData?.sms_provider || "Termii"}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Runtime Stack</span>
              <span className="font-mono text-foreground">
                PHP {serverHealth?.phpVersion || "8.2"} · Laravel {serverHealth?.laravelVersion || "10"}
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Billing & Gateway Split Breakdown */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">Tenant Billing &amp; Payment Gateway Analytics</h3>
              <p className="text-xs text-muted-foreground">
                Real-time settlement volume across Paystack, Flutterwave &amp; Monnify with automated ₦100 platform convenience splits.
              </p>
            </div>
            <Link
              to="/app/platform-transactions"
              className="text-xs font-semibold text-[hsl(var(--brand-indigo))] hover:underline flex items-center gap-1"
            >
              Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-border/50">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Online Fee Volume</p>
              <p className="text-base font-heading font-extrabold text-emerald-700 mt-1">
                {fmtNaira(stats?.onlinePaymentVolume ?? 0)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-border/50">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">₦100 Split Wallet</p>
              <p className="text-base font-heading font-extrabold text-[hsl(var(--brand-indigo))] mt-1">
                {fmtNaira(stats?.splitRevenue ?? 0)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-border/50">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Settled Txns</p>
              <p className="text-base font-heading font-extrabold text-foreground mt-1">
                {stats?.onlinePaymentSuccessCount ?? 0}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-border/50">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Queue Dispatches</p>
              <p className="text-base font-heading font-extrabold text-amber-600 mt-1">
                {pipelineData?.metrics?.total ?? 0}
              </p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {quickActions.map((a) => {
              const Icon = a.icon;
              if (a.onClick) {
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-indigo))]/40 hover:bg-secondary/50 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{a.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={a.label}
                  to={a.path}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-indigo))]/40 hover:bg-secondary/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Tenant Schools & Audit Trail */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">Onboarded Tenant Schools</h3>
            <Link
              to="/app/schools"
              className="text-sm font-semibold text-[hsl(var(--brand-violet))] flex items-center gap-1 hover:gap-2 transition-all"
            >
              Manage all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {(recentSchools || []).map((s) => (
              <Link
                key={s.id}
                to={`/app/schools/${s.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-border/60 hover:border-[hsl(var(--brand-violet))]/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-indigo))] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {s.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.studentCount} students · {s.teacherCount} teachers ·{" "}
                      <span className="uppercase font-semibold">{s.plan}</span> tier
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-2 ${
                    s.status === "active"
                      ? "bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]"
                      : s.status === "suspended"
                      ? "bg-[hsl(var(--brand-red))]/10 text-[hsl(var(--brand-red))]"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s.status}
                </span>
              </Link>
            ))}
            {(!recentSchools || recentSchools.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No schools registered yet</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-5 h-5 text-[hsl(var(--brand-violet))]" />
            <h3 className="font-heading font-bold text-lg text-foreground">Platform Audit Stream</h3>
          </div>
          <div className="space-y-1">
            {(recentActivity || []).map((log) => (
              <div key={log.id} className="py-3 border-b border-border/40 last:border-0">
                <p className="text-sm text-foreground font-medium">{log.description || log.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {log.actor_name} · {log.actor_role}
                  {log.school_name ? ` · ${log.school_name}` : ""}
                </p>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* School Onboarding Drawer powered by react-hook-form + Zod + Laravel 422 Error Mapper */}
      <FormDrawer
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        title="Onboard New Tenant School"
        description="Provision an isolated multi-tenant school workspace with subdomain slug and subscription tier."
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOnboardOpen(false)}
              className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmitOnboarding)}
              disabled={onboardMutation.isPending}
              className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {onboardMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning…
                </>
              ) : (
                "Provision Tenant School"
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmitOnboarding)} className="space-y-4" noValidate>
          {onboardSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {onboardSuccess}
            </div>
          )}
          {serverFormError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {serverFormError}
            </div>
          )}

          <div>
            <label className={labelCls}>Institution Full Name *</label>
            <input
              {...register("name", {
                onChange: (e) => {
                  const val = e.target.value;
                  const autoSlug = val
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                    .slice(0, 24);
                  if (autoSlug) setValue("slug", autoSlug, { shouldValidate: true });
                },
              })}
              placeholder="e.g. Greenwood International Academy"
              className={inputCls}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Short Code *</label>
              <input {...register("short_name")} placeholder="e.g. GIA" className={inputCls} />
              {errors.short_name && <p className="text-xs text-red-600 mt-1">{errors.short_name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>SaaS Subscription Tier *</label>
              <select {...register("plan")} className={inputCls}>
                <option value="free_trial">Free Trial (14d · Max 10)</option>
                <option value="standard">Standard (Max 250 Students)</option>
                <option value="premium">Premium (Unlimited)</option>
              </select>
              {errors.plan && <p className="text-xs text-red-600 mt-1">{errors.plan.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Tenant Subdomain Slug *</label>
            <div className="flex items-center">
              <input
                {...register("slug")}
                placeholder="greenwood"
                className="w-full h-10 px-3 rounded-l-lg border border-border bg-white text-sm font-mono"
              />
              <span className="h-10 px-3 inline-flex items-center bg-slate-100 border border-l-0 border-border rounded-r-lg text-xs text-muted-foreground font-mono">
                .iportalcampus.com
              </span>
            </div>
            {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Official Email *</label>
              <input type="email" {...register("email")} placeholder="admin@greenwood.edu.ng" className={inputCls} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Contact Phone *</label>
              <input {...register("phone")} placeholder="+2348030000000" className={inputCls} />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City *</label>
              <input {...register("city")} placeholder="Lagos" className={inputCls} />
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Brand Primary Color</label>
              <input type="color" {...register("primary_color")} className="w-full h-10 rounded-lg border border-border p-1 bg-white cursor-pointer" />
            </div>
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
