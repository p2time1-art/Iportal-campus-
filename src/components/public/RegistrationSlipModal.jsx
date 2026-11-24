import React from "react";
import { X, Printer, CheckCircle2, FileText, GraduationCap, User, ShieldCheck } from "lucide-react";

/**
 * Printable Admission Registration Slip modal preview.
 * Opens from ApplicationStatus ("Show Details" or post-payment confirmation).
 */
export default function RegistrationSlipModal({ open, onClose, application }) {
  if (!open || !application) return null;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const formatCurrency = (amt) =>
    `₦${Number(amt || 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const passportUrl = application.passport?.url || (typeof application.passport === "string" ? application.passport : "");
  const birthCertName = application.birth_certificate?.file_name || (application.birth_certificate ? "Uploaded" : "");
  const otherDocs = Array.isArray(application.other_documents) ? application.other_documents : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #iportal-registration-slip, #iportal-registration-slip * { visibility: visible !important; }
          #iportal-registration-slip {
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            padding: 12px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
        <div
          id="iportal-registration-slip"
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 my-2 sm:my-6 overflow-hidden"
        >
          {/* Top Action Bar (hidden when printing) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
              <FileText className="w-4 h-4 text-[#0f172a] shrink-0" />
              Admission Registration Slip
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Slip
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Slip Body */}
          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            {/* School Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-[#0f172a]">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {application.school_logo_url ? (
                  <img
                    src={application.school_logo_url}
                    alt={application.school_name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain border border-slate-200 bg-white p-1 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-heading font-extrabold text-base sm:text-xl text-[#0f172a] uppercase tracking-tight break-words">
                    {application.school_name || "iPortal Campus Institution"}
                  </h2>
                  {application.school_address && (
                    <p className="text-xs text-slate-500 mt-0.5 break-words">{application.school_address}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5 break-words">
                    {[application.school_phone, application.school_email].filter(Boolean).join(" · ") || "Admissions Office"}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-md bg-[#0f172a] text-white text-[11px] font-bold uppercase tracking-wider">
                  Registration Slip
                </span>
                <p className="font-mono text-sm font-bold text-[#0f172a] mt-2 break-all">
                  {application.application_number}
                </p>
                <p className="text-[11px] text-slate-500">
                  Submitted: {formatDate(application.submitted_at)}
                </p>
              </div>
            </div>

            {/* Applicant Overview + Passport */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-28 h-32 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                {passportUrl ? (
                  <img src={passportUrl} alt="Applicant Passport" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <User className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-[10px]">Passport</span>
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm w-full">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Applicant Full Name</p>
                  <p className="font-bold text-[#0f172a] mt-0.5">{application.applicant_name || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Application Status</p>
                  <p className="font-bold text-emerald-700 capitalize mt-0.5">
                    {(application.status || "submitted").replace("_", " ")}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Programme / Class Applied</p>
                  <p className="font-semibold text-[#0f172a] mt-0.5">
                    {[application.programme, application.class_name].filter(Boolean).join(" — ") || "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Gender &amp; Date of Birth</p>
                  <p className="font-semibold text-[#0f172a] capitalize mt-0.5">
                    {[application.gender, application.date_of_birth ? formatDate(application.date_of_birth) : null].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Academic Background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1.5 border-b border-slate-100">
                  Contact &amp; Academic History
                </h3>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Email:</span><span className="font-medium text-slate-900 text-right">{application.email || "—"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Phone:</span><span className="font-medium text-slate-900">{application.phone || "—"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Address:</span><span className="font-medium text-slate-900 text-right">{application.address || "—"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Previous School:</span><span className="font-medium text-slate-900 text-right">{application.previous_school || "—"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Last Qualification:</span><span className="font-medium text-slate-900 text-right">{application.previous_qualification || "—"}</span></div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1.5 border-b border-slate-100">
                  Parent / Guardian &amp; Documents
                </h3>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Guardian Name:</span><span className="font-medium text-slate-900 text-right">{application.guardian_name || "—"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Guardian Phone:</span><span className="font-medium text-slate-900">{application.guardian_phone || "—"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Guardian Email:</span><span className="font-medium text-slate-900 text-right">{application.guardian_email || "—"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Birth Certificate:</span><span className="font-medium text-slate-900 text-right">{birthCertName || "Not attached"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-500">Other Documents:</span><span className="font-medium text-slate-900 text-right">{otherDocs.length > 0 ? `${otherDocs.length} file(s)` : "None"}</span></div>
              </div>
            </div>

            {/* Payment Verification Block */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wide">
                    Application Fee Payment Verification
                  </h3>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${application.fee_paid ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"}`}>
                  {application.fee_paid ? <><CheckCircle2 className="w-3 h-3" /> PAID &amp; VERIFIED</> : "PAYMENT PENDING"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                <div>
                  <p className="text-emerald-700/80">Amount</p>
                  <p className="font-bold text-emerald-950">{formatCurrency(application.fee_amount)}</p>
                </div>
                <div>
                  <p className="text-emerald-700/80">Payment Reference</p>
                  <p className="font-mono font-semibold text-emerald-950">{application.payment_reference || "—"}</p>
                </div>
                <div>
                  <p className="text-emerald-700/80">Receipt Number</p>
                  <p className="font-mono font-semibold text-emerald-950">{application.receipt_number || "—"}</p>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500">
              <span>Keep this slip safe and present it during screening or enrollment.</span>
              <span className="font-mono">Printed: {new Date().toLocaleDateString("en-GB")}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
