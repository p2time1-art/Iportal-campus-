import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import FormDrawer from "@/components/admin/FormDrawer";
import { GraduationCap, Loader2, CheckCircle2, XCircle, Eye, Save, CreditCard, FileText, Download, UserPlus, KeyRound, Copy, AlertCircle } from "lucide-react";
import { downloadOfficialAdmissionLetterPdf } from "@/lib/documentEngine";
import { apiRequest } from "@/api/client";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

export default function Admissions() {
  const { schoolId } = useCurrentUser();
  const [applications, setApplications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [feeForm, setFeeForm] = useState({ application_fee_enabled: true, application_fee_amount: "5000" });
  const [savingFee, setSavingFee] = useState(false);
  const [feeSaved, setFeeSaved] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: "accepted", review_notes: "", class_id: "" });
  const [savingReview, setSavingReview] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState(null);
  const [enrollError, setEnrollError] = useState("");
  const [copiedCreds, setCopiedCreds] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [apps, sch, cls] = await Promise.all([
        base44.entities.AdmissionApplication.filter({ school_id: schoolId }, "-created_date", 500),
        base44.entities.School.get(schoolId).catch(() => null),
        base44.entities.SchoolClass.filter({ school_id: schoolId }, "name", 100).catch(() => []),
      ]);
      setApplications(apps || []);
      setClasses(cls || []);
      if (sch) {
        setSchoolData(sch);
        setFeeForm({
          application_fee_enabled: sch.application_fee_enabled !== false,
          application_fee_amount: String(sch.application_fee_amount ?? 5000),
        });
      }
    } catch (_e) {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveFee = async () => {
    if (!schoolId) return;
    setSavingFee(true);
    setFeeSaved(false);
    try {
      await base44.entities.School.update(schoolId, {
        application_fee_enabled: feeForm.application_fee_enabled,
        application_fee_amount: Number(feeForm.application_fee_amount) || 0,
      });
      setFeeSaved(true);
      setTimeout(() => setFeeSaved(false), 3000);
      load();
    } catch (_e) {}
    finally { setSavingFee(false); }
  };

  const openReview = (app) => {
    setSelectedApp(app);
    setEnrollError("");
    setCopiedCreds(false);
    setEnrollResult(
      app.provisioned_student_id
        ? {
            already_provisioned: true,
            student: {
              full_name: app.applicant_name,
              admission_number: app.admission_number || "Provisioned",
              class_name: app.enrolled_class_name || app.programme || "Assigned Class",
              login_pin: app.student_login_pin,
              default_password: "12345678",
            },
            parent: {
              full_name: app.guardian_name || `Parent of ${app.applicant_name}`,
              login_pin: app.parent_login_pin,
              default_password: "12345678",
            },
          }
        : null
    );
    setReviewForm({
      status: app.status === "draft" ? "submitted" : app.status,
      review_notes: app.review_notes || "",
      class_id: app.class_id ? String(app.class_id) : (classes[0]?.id ? String(classes[0].id) : ""),
    });
  };

  const handleSaveReview = async () => {
    if (!selectedApp) return;
    setSavingReview(true);
    try {
      await base44.entities.AdmissionApplication.update(selectedApp.id, {
        status: reviewForm.status,
        review_notes: reviewForm.review_notes,
        class_id: reviewForm.class_id ? Number(reviewForm.class_id) : undefined,
      });
      setSelectedApp(null);
      load();
    } catch (_e) {}
    finally { setSavingReview(false); }
  };

  const handleOneClickEnroll = async () => {
    if (!selectedApp) return;
    setEnrolling(true);
    setEnrollError("");
    try {
      const res = await apiRequest(`/v1/admission-applications/${selectedApp.id}/enroll`, {
        method: "POST",
        body: {
          class_id: reviewForm.class_id ? Number(reviewForm.class_id) : undefined,
          review_notes: reviewForm.review_notes,
        },
      });
      const data = res?.data || res;
      setEnrollResult(data);
      if (res?.application) {
        setSelectedApp(res.application);
      }
      load();
    } catch (err) {
      setEnrollError(err?.message || "Unable to enroll and provision accounts.");
    } finally {
      setEnrolling(false);
    }
  };

  const copyCredentials = () => {
    if (!enrollResult) return;
    const text = [
      `Admission Enrolled: ${selectedApp?.applicant_name || ""}`,
      `Admission No: ${enrollResult.student?.admission_number || "—"}`,
      `Class: ${enrollResult.student?.class_name || "—"}`,
      `Student Login PIN: ${enrollResult.student?.login_pin || "—"} (Default Password: 12345678)`,
      enrollResult.parent?.login_pin
        ? `Parent Login PIN: ${enrollResult.parent.login_pin} (Default Password: 12345678)`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard?.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const filtered = applications.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      a.applicant_name?.toLowerCase().includes(q) ||
      a.application_number?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.student_pin?.toLowerCase().includes(q) ||
      a.parent_pin?.toLowerCase().includes(q) ||
      a.login_pin?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <AdminPageHeader
        title="Admissions & Applications"
        subtitle="Manage online admission applications, verify applicant documents, and configure the application fee."
        icon={GraduationCap}
      />

      {/* Application Fee Configuration Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">Admission Application Fee</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Applicants see and pay this fee on the public application review screen ({schoolData?.name || "Your School"}).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={feeForm.application_fee_enabled}
                onChange={(e) => setFeeForm({ ...feeForm, application_fee_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              Require Fee
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">₦</span>
              <input
                type="number"
                min="0"
                value={feeForm.application_fee_amount}
                onChange={(e) => setFeeForm({ ...feeForm, application_fee_amount: e.target.value })}
                disabled={!feeForm.application_fee_enabled}
                className="w-32 h-9 px-3 rounded-lg border border-border bg-white text-sm font-bold text-foreground"
              />
            </div>
            <button
              onClick={handleSaveFee}
              disabled={savingFee}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-xs font-semibold disabled:opacity-60"
            >
              {savingFee ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Fee
            </button>
            {feeSaved && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search applicant name, email, APP no, or PIN…" />
            <select
              className="h-10 px-3 rounded-lg border border-border bg-white text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted / Approved</option>
              <option value="enrolled">Enrolled</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Pending Payment</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} application{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No applications found" description="Public admission applications submitted via /applications/new will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">App No</th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Programme / Class</th>
                  <th className="px-4 py-3 font-semibold">Fee</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{app.application_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{app.applicant_name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{app.programme || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${app.fee_paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {app.fee_paid ? `Paid (₦${Number(app.fee_amount || 5000).toLocaleString()})` : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-700">
                        {(app.status || "submitted").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {["accepted", "admitted", "enrolled"].includes(app.status) && (
                          <button
                            onClick={() => downloadOfficialAdmissionLetterPdf(app.application_number || app.id, app.application_number)}
                            className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100"
                            title="Download Official Admission Letter PDF"
                          >
                            <Download className="w-3.5 h-3.5" /> Admission Letter
                          </button>
                        )}
                        <button
                          onClick={() => openReview(app)}
                          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] text-xs font-semibold hover:bg-[hsl(var(--brand-indigo))]/20"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
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
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={`Review Application — ${selectedApp?.application_number || ""}`}
        description={selectedApp?.applicant_name || ""}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setSelectedApp(null)} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={handleSaveReview}
              disabled={savingReview}
              className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {savingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Decision"}
            </button>
          </div>
        }
      >
        {selectedApp && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4">
              <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-semibold">{selectedApp.applicant_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Programme</p><p className="font-semibold">{selectedApp.programme || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p>{selectedApp.email || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Phone</p><p>{selectedApp.phone || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Guardian</p><p>{selectedApp.guardian_name || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Guardian Phone</p><p>{selectedApp.guardian_phone || "—"}</p></div>
            </div>

            <div className="border border-border rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uploaded Documents</p>
              <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /> Passport: {selectedApp.passport?.url ? <a href={selectedApp.passport.url} target="_blank" rel="noreferrer" className="text-[hsl(var(--brand-indigo))] underline">View File</a> : "Not uploaded"}</p>
              <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /> Birth Certificate: {selectedApp.birth_certificate?.url ? <a href={selectedApp.birth_certificate.url} target="_blank" rel="noreferrer" className="text-[hsl(var(--brand-indigo))] underline">View File</a> : "Not uploaded"}</p>
            </div>

            <div>
              <label className={labelCls}>Target Class Placement</label>
              <select
                className={inputCls}
                value={reviewForm.class_id}
                onChange={(e) => setReviewForm({ ...reviewForm, class_id: e.target.value })}
              >
                <option value="">Auto-match from programme ({selectedApp.programme || "Default"})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Admission Decision</label>
              <select className={inputCls} value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="accepted">Accept / Admit Applicant</option>
                <option value="enrolled">Enrolled</option>
                <option value="rejected">Reject Application</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Review Notes (visible to applicant on status check)</label>
              <textarea
                className="w-full min-h-[72px] px-3 py-2 rounded-lg border border-border bg-white text-sm"
                value={reviewForm.review_notes}
                onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
                placeholder="e.g. Congratulations, you have been offered provisional admission…"
              />
            </div>

            {/* One-Click Atomic Enroll & Provision Student + Parent Accounts */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-700" />
                    One-Click Enroll &amp; Provision Student + Parent Accounts
                  </h4>
                  <p className="text-xs text-emerald-800/80 mt-0.5">
                    Atomically creates the Student record, assigns the selected Class, links the Primary Parent/Guardian, and generates Login PINs for both accounts.
                  </p>
                </div>
              </div>

              {enrollError && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {enrollError}
                </div>
              )}

              {enrollResult ? (
                <div className="bg-white rounded-xl border border-emerald-200 p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Enrolled &amp; Provisioned
                    </span>
                    <button
                      type="button"
                      onClick={copyCredentials}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--brand-indigo))] hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" /> {copiedCreds ? "Copied!" : "Copy PINs"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold">Student Login PIN</p>
                      <p className="font-mono font-bold text-slate-900 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-[hsl(var(--brand-indigo))]" />
                        {enrollResult.student?.login_pin || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Adm No: {enrollResult.student?.admission_number || "—"} · {enrollResult.student?.class_name || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold">Parent Login PIN</p>
                      <p className="font-mono font-bold text-slate-900 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-emerald-600" />
                        {enrollResult.parent?.login_pin || "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Guardian: {enrollResult.parent?.full_name || "Linked"}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Default password for first login: <strong className="font-mono text-foreground">12345678</strong> (Welcome emails queued).
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOneClickEnroll}
                  disabled={enrolling}
                  className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
                >
                  {enrolling ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning Student &amp; Parent Accounts…</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Enroll &amp; Provision Student + Parent Accounts</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
