import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import RegistrationSlipModal from "@/components/public/RegistrationSlipModal";
import { Search, Loader2, AlertCircle, FileText, Calendar, GraduationCap, CheckCircle2, Clock, XCircle, Download, Eye, Printer } from "lucide-react";
import { downloadOfficialAdmissionLetterPdf } from "@/lib/documentEngine";

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "text-slate-600 bg-slate-100" },
  submitted: { label: "Submitted", icon: Clock, color: "text-blue-600 bg-blue-50" },
  under_review: { label: "Under Review", icon: Clock, color: "text-amber-600 bg-amber-50" },
  accepted: { label: "Accepted", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-red-600 bg-red-50" },
  admitted: { label: "Admitted", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  enrolled: { label: "Enrolled", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" }
};

export default function ApplicationStatus() {
  const [appNumber, setAppNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [finalizeMsg, setFinalizeMsg] = useState("");
  const [slipOpen, setSlipOpen] = useState(false);

  // Check for payment reference in URL (after payment redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) {
      setFinalizing(true);
      (async () => {
        try {
          const res = await base44.functions.invoke("finalizeAdmissionApplication", { internal_reference: ref });
          const data = res.data || res;
          if (data.application_number) {
            setAppNumber(data.application_number);
            setFinalizeMsg(data.message || "Payment verified! Your application has been submitted and your Registration Slip is ready.");
            setResult(
              data.application || {
                application_number: data.application_number,
                school_name: data.school_name || "",
                programme: data.programme || "",
                status: data.status || "submitted",
                submitted_at: data.submitted_at || new Date().toISOString(),
                payment_reference: data.payment_reference || ref,
                receipt_number: data.receipt_number || "",
                fee_amount: data.fee_amount || 0,
                fee_paid: true,
                review_notes: "",
              }
            );
            setSlipOpen(true);
          }
        } catch (err) {
          setFinalizeMsg("");
          setError(err?.response?.data?.error || err?.data?.error || err?.message || "Payment verification failed. Please contact the school.");
        } finally {
          setFinalizing(false);
        }
      })();
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setFinalizeMsg("");
    if (!appNumber.trim()) {
      setError("Please enter your application number.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("checkApplicationStatus", { application_number: appNumber.trim() });
      setResult(res.data || res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Unable to find application.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

  if (finalizing) {
    return (
      <PublicPageLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#0f172a] mx-auto mb-4" />
          <h1 className="font-heading font-bold text-xl text-[#1a2336] mb-2">Verifying Payment…</h1>
          <p className="text-slate-500">Please wait while we confirm your application fee payment and generate your Registration Slip.</p>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0f172a] mb-4">
            <Search className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-[#1a2336] mb-2">Application Status</h1>
          <p className="text-slate-500">Enter your application number to check the current status of your application or print your Registration Slip.</p>
        </div>

        {finalizeMsg && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 mb-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{finalizeMsg}</span>
            </div>
            {result && (
              <button
                type="button"
                onClick={() => setSlipOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shrink-0"
              >
                <Printer className="w-3.5 h-3.5" /> Print Slip
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={appNumber}
              onChange={(e) => setAppNumber(e.target.value)}
              placeholder="e.g., APP/GA/2026/XXXXXX"
              className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Check
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mt-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </form>

        {result && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {(() => {
              const sc = statusConfig[result.status] || statusConfig.submitted;
              const SIcon = sc.icon;
              return (
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Application Number</p>
                    <p className="font-mono text-lg font-bold text-[#0f172a]">{result.application_number}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${sc.color}`}>
                    <SIcon className="w-4 h-4" /> {sc.label}
                  </span>
                </div>
              );
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                <div><p className="text-xs font-semibold text-slate-400">Programme</p><p className="text-sm text-[#0f172a]">{result.programme || result.class_name || "—"}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                <div><p className="text-xs font-semibold text-slate-400">School</p><p className="text-sm text-[#0f172a]">{result.school_name || "—"}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#f97316] shrink-0 mt-0.5" />
                <div><p className="text-xs font-semibold text-slate-400">Submitted</p><p className="text-sm text-[#0f172a]">{formatDate(result.submitted_at)}</p></div>
              </div>
            </div>

            {/* Small "Show Details" button below status info to preview full printable Registration Slip */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSlipOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#0f172a] transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#f97316]" /> Show Details
              </button>
              {result.fee_paid && (
                <button
                  type="button"
                  onClick={() => setSlipOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-xs font-semibold text-white transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Registration Slip
                </button>
              )}
            </div>

            {result.review_notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Review Notes</p>
                <p className="text-sm text-amber-800">{result.review_notes}</p>
              </div>
            )}
            {(result.status === "accepted" || result.status === "admitted") && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-emerald-800 mb-3">Congratulations! Your application has been accepted. You can now download your official Provisional Admission Letter and sign up for your student portal account.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadOfficialAdmissionLetterPdf(result.application_number, result.application_number)}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Admission Letter (PDF)
                  </button>
                  <Link to="/admission/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline">
                    Sign up for your student account →
                  </Link>
                </div>
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <Link to="/applications/documents" className="text-sm font-semibold text-[#f97316] hover:underline">View Required Documents Checklist →</Link>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/applications/new" className="text-sm font-semibold text-[#0f172a] hover:text-[#f97316]">Submit a new application →</Link>
        </div>
      </div>

      <RegistrationSlipModal
        open={slipOpen}
        onClose={() => setSlipOpen(false)}
        application={result}
      />
    </PublicPageLayout>
  );
}
