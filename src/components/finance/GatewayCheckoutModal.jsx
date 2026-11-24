import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Printer,
  Copy,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Building2,
  ExternalLink,
  Smartphone,
  GraduationCap,
} from "lucide-react";
import { formatCurrency, GATEWAY_LABELS } from "@/lib/finance";

function formatRrr(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  }
  return raw || "—";
}

export default function GatewayCheckoutModal({ open, onClose, session, school }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!open || !session) return null;

  const gateway = (session.gateway || "paystack").toLowerCase();
  const isRemita = gateway === "remita";
  const gatewayLabel = GATEWAY_LABELS[gateway] || gateway.toUpperCase();
  const split = session.fee_split || {};
  const totalPayable = Number(split.total_payable || split.base_amount || 0);
  const baseAmount = Number(split.base_amount || totalPayable);
  const convenienceFee = Number(split.convenience_fee || 0);
  const rrrFormatted = formatRrr(session.rrr);
  const items = Array.isArray(session.allocation_plan) ? session.allocation_plan : [];

  const handleCopyRrr = () => {
    const plain = String(session.rrr || "").replace(/\D/g, "") || session.reference;
    navigator.clipboard?.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceed = () => {
    const url = session.authorization_url;
    if (!url) return;
    if (url.startsWith("/")) {
      onClose?.();
      navigate(url);
    } else {
      window.location.href = url;
    }
  };

  const handleVerifyStatus = () => {
    onClose?.();
    navigate(`/app/payment-status?ref=${encodeURIComponent(session.reference)}&reference=${encodeURIComponent(session.reference)}&status=success`);
  };

  return (
    <>
      {isRemita && (
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            body * {
              visibility: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #iportal-rrr-slip, #iportal-rrr-slip * { visibility: visible !important; }
            #iportal-rrr-slip {
              position: fixed !important;
              inset: 0 !important;
              margin: 0 !important;
              padding: 16px !important;
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
      )}

      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
        <div
          id={isRemita ? "iportal-rrr-slip" : "iportal-gateway-checkout"}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-border my-4 overflow-hidden"
        >
          {/* Top Action Bar */}
          <div className="no-print flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-slate-50 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CreditCard className="w-4 h-4 text-[hsl(var(--brand-indigo))]" />
              {isRemita ? "Remita RRR Payment Advice Slip" : `${gatewayLabel} Secure Checkout`}
              {session.environment === "test" && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Sandbox
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isRemita && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" /> Print RRR Slip
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-muted-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-7 space-y-5">
            {/* School Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                {school?.logo_url ? (
                  <img
                    src={school.logo_url}
                    alt={school.name}
                    className="w-12 h-12 rounded-xl object-contain border border-border bg-white p-1 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[hsl(var(--brand-navy))] text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-heading font-extrabold text-base text-foreground uppercase truncate">
                    {school?.name || "iPortal Campus Institution"}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {[session.session_name, session.term_name].filter(Boolean).join(" · ") || "Official School Fee Payment"}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Payment Reference</p>
                <p className="font-mono text-xs font-bold text-foreground">{session.reference}</p>
              </div>
            </div>

            {/* Remita Highlighted RRR Box */}
            {isRemita && (
              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
                      Remita Retrieval Reference (RRR)
                    </p>
                    <p className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-900 mt-1">
                      {rrrFormatted}
                    </p>
                    <p className="text-[11px] text-orange-800/80 mt-1">
                      Service Type ID: <strong className="font-mono">{session.service_type_id || "4430731"}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRrr}
                    className="no-print inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shrink-0"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "RRR Copied!" : "Copy RRR"}
                  </button>
                </div>
              </div>
            )}

            {/* Payer & Student Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-border/70 p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Student</p>
                <p className="font-bold text-foreground mt-0.5">{session.student_name || "—"}</p>
                {session.admission_number && (
                  <p className="font-mono text-muted-foreground mt-0.5">{session.admission_number}</p>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 border border-border/70 p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Payer Details</p>
                <p className="font-bold text-foreground mt-0.5">{session.payer_name || "—"}</p>
                <p className="text-muted-foreground mt-0.5 truncate">{session.payer_email || "—"}</p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-border text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Fee Item</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2.5 font-medium text-foreground">{item.category_name || "School Fee"}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-foreground">Selected School Fees</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                        {formatCurrency(baseAmount)}
                      </td>
                    </tr>
                  )}
                  {convenienceFee > 0 && (
                    <tr className="bg-slate-50/60">
                      <td className="px-4 py-2 text-muted-foreground">Gateway &amp; Processing Fee ({gatewayLabel})</td>
                      <td className="px-4 py-2 text-right font-medium text-muted-foreground">
                        {formatCurrency(convenienceFee)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 border-t border-emerald-200">
                    <td className="px-4 py-3 font-bold text-emerald-950 text-sm">Total Payable</td>
                    <td className="px-4 py-3 text-right font-heading font-extrabold text-emerald-900 text-base">
                      {formatCurrency(totalPayable)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Instructions for Remita */}
            {isRemita && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-700">
                <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                  How to Complete Payment with this RRR
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Any Nigerian Bank Branch:</strong> Present this printed slip and quote RRR{" "}
                      <strong className="font-mono">{rrrFormatted}</strong> at the teller counter.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Smartphone className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Remita App / Internet Banking:</strong> Select <em>Pay RRR Invoice</em>, enter{" "}
                      <strong className="font-mono">{rrrFormatted}</strong>, and pay with Card, Transfer, or USSD.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Your official QR-verified receipt is generated automatically as soon as {gatewayLabel} confirms payment.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 px-5 py-4 border-t border-border bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-border bg-white hover:bg-slate-100 text-xs font-semibold text-foreground"
            >
              Cancel
            </button>
            {isRemita ? (
              <>
                <button
                  type="button"
                  onClick={handleVerifyStatus}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" /> I Have Paid — Verify RRR
                </button>
                <button
                  type="button"
                  onClick={handleProceed}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Pay Online Now
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleProceed}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl bg-[hsl(var(--brand-indigo))] hover:opacity-95 text-white text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Proceed to {gatewayLabel} Checkout
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
