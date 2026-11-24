import React, { useState, useEffect, useCallback } from "react";
import { Mail, MessageSquare, FileText, Cpu, Send, RefreshCw, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const selectCls = "h-9 px-3 rounded-lg bg-white border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function NotificationPipelinePanel() {
  const { schoolId } = useCurrentUser();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState("");

  // Email dispatch form
  const [emailProvider, setEmailProvider] = useState("postmark");
  const [emailTemplate, setEmailTemplate] = useState("termly_invoice");

  // SMS / WhatsApp alert form
  const [smsProvider, setSmsProvider] = useState("termii");
  const [alertChannel, setAlertChannel] = useState("sms");
  const [alertType, setAlertType] = useState("attendance_absence");
  const [emergencyNote, setEmergencyNote] = useState("");

  // Bulk report card compilation form
  const [pdfTemplate, setPdfTemplate] = useState("classic");

  const apiCall = useCallback(async (path, method = "GET", body = null) => {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    try {
      const slug = localStorage.getItem("iportal_active_school_slug");
      if (slug) headers["X-School-Slug"] = slug;
    } catch (_e) {}

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }, []);

  const loadStatus = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await apiCall(`/pipeline/status?school_id=${schoolId}`);
      setStatusData(data);
      if (data?.email_provider) setEmailProvider(data.email_provider);
      if (data?.sms_provider) setSmsProvider(data.sms_provider);
    } catch (_e) {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [schoolId, apiCall]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleDispatchEmail = async () => {
    setBusyAction("email");
    setFeedback("");
    try {
      const res = await apiCall("/pipeline/emails/dispatch", "POST", {
        school_id: schoolId,
        provider: emailProvider,
        template_key: emailTemplate,
      });
      setFeedback(`Queued ${res.count || 1} '${emailTemplate.replace(/_/g, " ")}' email(s) via ${emailProvider.toUpperCase()} (Batch ${res.batch_id}).`);
      loadStatus();
    } catch (_e) {
      setFeedback("Failed to queue transactional email batch.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDispatchAlert = async () => {
    setBusyAction("alert");
    setFeedback("");
    try {
      const res = await apiCall("/pipeline/alerts/dispatch", "POST", {
        school_id: schoolId,
        provider: smsProvider,
        channel: alertChannel,
        alert_type: alertType,
        custom_message: emergencyNote || undefined,
      });
      setFeedback(`Queued ${res.count || 1} ${alertChannel.toUpperCase()} parent alert(s) via ${smsProvider.toUpperCase()} (Batch ${res.batch_id}).`);
      loadStatus();
    } catch (_e) {
      setFeedback("Failed to queue SMS/WhatsApp alert batch.");
    } finally {
      setBusyAction("");
    }
  };

  const handleCompileReportCards = async () => {
    setBusyAction("pdf");
    setFeedback("");
    try {
      const res = await apiCall("/pipeline/report-cards/compile", "POST", {
        school_id: schoolId,
        template: pdfTemplate,
      });
      setFeedback(`Queued background compilation of ${res.student_count || 0} Official Report Cards (${res.batch_id}).`);
      loadStatus();
    } catch (_e) {
      setFeedback("Failed to queue bulk report card compilation.");
    } finally {
      setBusyAction("");
    }
  };

  const metrics = statusData?.metrics || {};
  const dispatches = statusData?.dispatches || [];

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 mb-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-indigo))]/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-foreground">
              Asynchronous Notification &amp; Background Job Pipeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Redis + Laravel Horizon Worker Queues &bull; Transactional Emails (Postmark / SendGrid / SES / Mailgun) &bull; Bulk SMS &amp; WhatsApp (Termii / Africa&apos;s Talking / Twilio)
            </p>
          </div>
        </div>
        <button
          onClick={loadStatus}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-foreground shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {feedback}
        </div>
      )}

      {/* Queue KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 border border-border/40">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Transactional Emails</p>
          <p className="text-lg font-heading font-extrabold text-foreground mt-0.5">{metrics.emails_sent ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Active: {(statusData?.email_provider || emailProvider).toUpperCase()}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-border/40">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Bulk SMS Dispatched</p>
          <p className="text-lg font-heading font-extrabold text-[hsl(var(--brand-indigo))] mt-0.5">{metrics.sms_sent ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Gateway: {(statusData?.sms_provider || smsProvider).toUpperCase()}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-border/40">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">WhatsApp Alerts</p>
          <p className="text-lg font-heading font-extrabold text-emerald-600 mt-0.5">{metrics.whatsapp_sent ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Parent Instant Alerts</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-border/40">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Bulk PDF Batches</p>
          <p className="text-lg font-heading font-extrabold text-amber-600 mt-0.5">{metrics.pdf_batches ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Horizon Queue: Ready</p>
        </div>
      </div>

      {/* 3 Action Cards: Email System, Bulk SMS/WhatsApp Alerts, Bulk Report Card Compiler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Transactional Email System */}
        <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />
            <h4 className="font-heading font-bold text-sm text-foreground">Transactional Email Queue</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Provider</label>
              <select className={selectCls + " w-full"} value={emailProvider} onChange={(e) => setEmailProvider(e.target.value)}>
                <option value="postmark">Postmark</option>
                <option value="sendgrid">SendGrid</option>
                <option value="ses">Amazon SES</option>
                <option value="mailgun">Mailgun</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Email Template</label>
              <select className={selectCls + " w-full"} value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)}>
                <option value="welcome_onboarding">Welcome Onboarding</option>
                <option value="password_reset">Password Reset</option>
                <option value="termly_invoice">Termly Invoice Delivery</option>
                <option value="admission_acceptance">Admission Acceptance</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleDispatchEmail}
            disabled={busyAction === "email"}
            className="w-full h-9 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busyAction === "email" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Queue Transactional Email
          </button>
        </div>

        {/* 2. Bulk SMS / WhatsApp Parent Alerts */}
        <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h4 className="font-heading font-bold text-sm text-foreground">Bulk SMS &amp; WhatsApp Alerts</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Gateway</label>
              <select className={selectCls + " w-full"} value={smsProvider} onChange={(e) => setSmsProvider(e.target.value)}>
                <option value="termii">Termii</option>
                <option value="africastalking">Africa&apos;s Talking</option>
                <option value="twilio">Twilio</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Channel</label>
              <select className={selectCls + " w-full"} value={alertChannel} onChange={(e) => setAlertChannel(e.target.value)}>
                <option value="sms">Bulk SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Alert Type</label>
              <select className={selectCls + " w-full"} value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                <option value="attendance_absence">Attendance Absences</option>
                <option value="fee_payment_reminder">Fee Reminders</option>
                <option value="exam_result_release">Result Releases</option>
                <option value="emergency_school_closure">Emergency Closure</option>
              </select>
            </div>
          </div>
          {alertType === "emergency_school_closure" && (
            <input
              type="text"
              value={emergencyNote}
              onChange={(e) => setEmergencyNote(e.target.value)}
              placeholder="Emergency closure details…"
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-white text-xs"
            />
          )}
          <button
            onClick={handleDispatchAlert}
            disabled={busyAction === "alert"}
            className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busyAction === "alert" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : < AlertTriangle className="w-3.5 h-3.5" />}
            Dispatch Parent {alertChannel.toUpperCase()} Alert
          </button>
        </div>

        {/* 3. Asynchronous Bulk Report Card PDF Compilation */}
        <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <h4 className="font-heading font-bold text-sm text-foreground">Async Report Card Compiler</h4>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Report Card PDF Template</label>
            <select className={selectCls + " w-full"} value={pdfTemplate} onChange={(e) => setPdfTemplate(e.target.value)}>
              <option value="classic">Classic Institutional Template</option>
              <option value="modern">Modern Crest Template</option>
              <option value="compact">Compact Summary Template</option>
            </select>
          </div>
          <button
            onClick={handleCompileReportCards}
            disabled={busyAction === "pdf"}
            className="w-full h-9 rounded-lg bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-violet))] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busyAction === "pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
            Compile All Report Cards in Background
          </button>
        </div>
      </div>

      {/* Recent Asynchronous Queue Dispatches */}
      {dispatches.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Recent Background Queue Jobs ({dispatches.length})
          </p>
          <div className="overflow-x-auto max-h-48 border border-border/50 rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground border-b border-border/50">
                  <th className="px-3 py-2">Queue / Channel</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Template / Event</th>
                  <th className="px-3 py-2">Recipient</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Provider Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {dispatches.slice(0, 8).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-mono uppercase">{d.channel}</td>
                    <td className="px-3 py-2 uppercase font-semibold">{d.provider}</td>
                    <td className="px-3 py-2 capitalize">{(d.template_key || "").replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.recipient}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{d.provider_message_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
