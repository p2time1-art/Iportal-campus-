import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Building2, GraduationCap, Users, BookOpen, CreditCard, ShieldCheck, ScrollText } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import GatewayManagementPanel from "@/components/platform/GatewayManagementPanel";
import FeatureFlagsPanel from "@/components/platform/FeatureFlagsPanel";
import SchoolDomainPanel from "@/components/platform/SchoolDomainPanel";

export default function SchoolProfile() {
  const { schoolId } = useParams();
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState({ students: 0, teachers: 0, parents: 0, admins: 0, classes: 0, subjects: 0, sessions: 0, terms: 0 });
  const [finance, setFinance] = useState({ totalBilled: 0, totalPaid: 0, outstanding: 0 });
  const [subscription, setSubscription] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sch = await base44.entities.School.get(schoolId);
        if (!mounted) return;
        setSchool(sch);

        const [students, teachers, parents, memberships, classes, subjects, sessions, terms, charges, payments, subs, logs] = await Promise.all([
          base44.entities.Student.filter({ school_id: schoolId }, "-created_date", 500).catch(() => []),
          base44.entities.Teacher.filter({ school_id: schoolId }, "-created_date", 500).catch(() => []),
          base44.entities.ParentGuardian.filter({ school_id: schoolId }, "-created_date", 500).catch(() => []),
          base44.entities.SchoolMembership.filter({ school_id: schoolId, role: "school_admin" }, "-created_date", 50).catch(() => []),
          base44.entities.SchoolClass.filter({ school_id: schoolId }, "-created_date", 200).catch(() => []),
          base44.entities.Subject.filter({ school_id: schoolId }, "-created_date", 200).catch(() => []),
          base44.entities.AcademicSession.filter({ school_id: schoolId }, "-created_date", 50).catch(() => []),
          base44.entities.Term.filter({ school_id: schoolId }, "-created_date", 50).catch(() => []),
          base44.entities.StudentCharge.filter({ school_id: schoolId }, "-created_date", 500).catch(() => []),
          base44.entities.Payment.filter({ school_id: schoolId, status: "successful" }, "-created_date", 500).catch(() => []),
          base44.entities.Subscription.filter({ school_id: schoolId }, "-created_date", 5).catch(() => []),
          base44.entities.AuditLog.filter({ school_id: schoolId }, "-created_date", 10).catch(() => [])
        ]);

        if (!mounted) return;

        setStats({
          students: students.length, teachers: teachers.length,
          parents: parents.length, admins: memberships.length,
          classes: classes.length, subjects: subjects.length,
          sessions: sessions.length, terms: terms.length
        });

        const totalBilled = (charges || []).reduce((sum, c) => sum + (Number(c.net_amount) || 0), 0);
        const totalPaid = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        setFinance({ totalBilled, totalPaid, outstanding: totalBilled - totalPaid });

        setSubscription((subs && subs[0]) || null);
        setActivity(logs || []);
      } catch (_e) {
        // non-fatal
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-[hsl(var(--brand-indigo))] rounded-full animate-spin" />
      </div>
    );
  }

  if (!school) {
    return <EmptyState icon={Building2} title="School not found" description="The school you're looking for doesn't exist or has been removed." />;
  }

  const fmtNaira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

  const infoItems = [
    { label: "School Code", value: school.school_code || school.short_name || "—" },
    { label: "Portal URL", value: <span className="font-mono text-xs text-[hsl(var(--brand-indigo))]">{school.portal_url || school.subdomain_url || "—"}</span> },
    { label: "Email", value: school.email || "—" },
    { label: "Phone", value: school.phone || "—" },
    { label: "Website", value: school.website || "—" },
    { label: "Address", value: [school.address, school.city, school.country].filter(Boolean).join(", ") || "—" },
    { label: "Plan", value: <span className="capitalize font-semibold">{school.plan}</span> },
    { label: "Status", value: <StatusBadge status={school.status} /> },
    { label: "Created", value: school.created_date ? new Date(school.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—" }
  ];

  const academicItems = [
    { label: "Students", value: stats.students, icon: GraduationCap, color: "orange" },
    { label: "Teachers", value: stats.teachers, icon: Users, color: "indigo" },
    { label: "Parents", value: stats.parents, icon: Users, color: "blue" },
    { label: "Classes", value: stats.classes, icon: BookOpen, color: "green" },
    { label: "Subjects", value: stats.subjects, icon: BookOpen, color: "navy" },
    { label: "School Admins", value: stats.admins, icon: ShieldCheck, color: "indigo" }
  ];

  return (
    <div className="space-y-6">
      <Link to="/app/schools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Schools
      </Link>

      {/* School header */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-indigo))] flex items-center justify-center text-white font-bold text-xl shrink-0">
            {school.name?.split(" ").map(p => p[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading font-extrabold text-2xl text-foreground">{school.name}</h1>
            {school.motto && <p className="text-sm text-muted-foreground italic mt-1">"{school.motto}"</p>}
            <div className="mt-2"><StatusBadge status={school.status} /></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* School info */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">School Information</h3>
          <div className="space-y-3">
            {infoItems.map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
                <span className="text-sm font-semibold text-foreground text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic overview */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">Academic Overview</h3>
          <div className="grid grid-cols-3 gap-3">
            {academicItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center text-center p-3 rounded-xl border border-border/40">
                  <div className={`w-9 h-9 rounded-lg bg-[hsl(var(--brand-${item.color}))]/10 flex items-center justify-center mb-2`}>
                    <Icon className={`w-4 h-4 text-[hsl(var(--brand-${item.color}))`} />
                  </div>
                  <span className="text-xl font-heading font-extrabold text-foreground">{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Finance overview */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">Finance Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
              <span className="text-sm text-muted-foreground">Total Billed</span>
              <span className="text-lg font-heading font-bold text-foreground">{fmtNaira(finance.totalBilled)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--brand-green))]/5">
              <span className="text-sm text-muted-foreground">Total Collected</span>
              <span className="text-lg font-heading font-bold text-[hsl(var(--brand-green))]">{fmtNaira(finance.totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--brand-orange))]/5">
              <span className="text-sm text-muted-foreground">Outstanding Balance</span>
              <span className="text-lg font-heading font-bold text-[hsl(var(--brand-orange))]">{fmtNaira(finance.outstanding)}</span>
            </div>
          </div>
        </div>

        {/* Subscription overview */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">Subscription Overview</h3>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-semibold capitalize">{subscription.plan_name}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={subscription.status} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <span className="text-sm text-muted-foreground">Start Date</span>
                <span className="text-sm font-semibold">{subscription.start_date || "—"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <span className="text-sm text-muted-foreground">Expiry Date</span>
                <span className="text-sm font-semibold">{subscription.expiry_date || "—"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold">{fmtNaira(subscription.amount)}</span>
              </div>
            </div>
          ) : (
            <EmptyState icon={CreditCard} title="No subscription" description="This school doesn't have an active subscription yet." />
          )}
        </div>
      </div>

      {/* Portal Subdomain & Custom Domain Assignment */}
      <SchoolDomainPanel school={school} onUpdated={(updated) => setSchool(updated)} />

      {/* Payment Gateway Management */}
      <GatewayManagementPanel schoolId={schoolId} schoolName={school.name} />

      {/* School Feature Overrides */}
      <div className="mt-6">
        <FeatureFlagsPanel schoolId={schoolId} schoolName={school.name} />
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText className="w-5 h-5 text-[hsl(var(--brand-violet))]" />
          <h3 className="font-heading font-bold text-base text-foreground">Recent Activity</h3>
        </div>
        {activity.length > 0 ? (
          <div className="space-y-1">
            {activity.map(log => (
              <div key={log.id} className="py-3 border-b border-border/40 last:border-0">
                <p className="text-sm text-foreground font-medium">{log.description || log.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {log.actor_name} · {log.actor_role} · {new Date(log.created_date).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity for this school</p>
        )}
      </div>
    </div>
  );
}