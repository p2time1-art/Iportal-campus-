import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Clock, Download, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency, GATEWAY_LABELS } from "@/lib/finance";
import { generateReceiptPdf } from "@/lib/receiptPdf";

export default function PaymentStatus() {
  const params = new URLSearchParams(window.location.search);
  const refParam = params.get("ref") || params.get("reference") || params.get("trxref");
  const { school } = useCurrentUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    if (!refParam) {
      setError("No transaction reference provided. If you made a payment, please check your payment history.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await base44.functions.invoke("getOnlinePaymentStatus", { internal_reference: refParam });
        if (cancelled) return;
        setData(res.data);
        const st = res.data?.status;

        if (st === "pending" || st === "initiated") {
          pollRef.current = setTimeout(poll, 3000);
        } else {
          setLoading(false);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e.response?.data?.error || e.message || "Failed to verify payment status.");
        setLoading(false);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [refParam]);

  const downloadReceipt = async () => {
    if (!data?.transaction?.payment_id) return;
    try {
      const [payment, receipts] = await Promise.all([
        base44.entities.Payment.get(data.transaction.payment_id),
        base44.entities.Receipt.filter({ payment_id: data.transaction.payment_id }, "-created_date", 5)
      ]);
      const receipt = receipts?.[0];
      if (!receipt) return;

      const student = await base44.entities.Student.get(data.transaction.student_id || "").catch(() => null);
      const allocs = await base44.entities.PaymentAllocation.filter(
        { payment_id: data.transaction.payment_id }, "-created_date", 50
      );

      generateReceiptPdf({
        school,
        student: student || { full_name: data.transaction.student_name },
        payment,
        receipt,
        allocations: (allocs || []).map(a => ({ category_name: a.category_name, amount: a.amount })),
        sessionName: data.transaction.session_name || "",
        termName: data.transaction.term_name || ""
      });
    } catch (_e) { /* non-fatal */ }
  };

  const txn = data?.transaction;
  const status = data?.status;

  const statusConfig = {
    success: { icon: CheckCircle2, color: "text-[hsl(var(--brand-green))]", bg: "bg-[hsl(var(--brand-green))]/10", title: "Payment Successful", message: "Your payment has been verified and recorded." },
    failed: { icon: XCircle, color: "text-[hsl(var(--brand-red))]", bg: "bg-[hsl(var(--brand-red))]/10", title: "Payment Failed", message: txn?.failure_reason || "Your payment was not successful. Please try again." },
    pending: { icon: Clock, color: "text-[hsl(var(--brand-orange))]", bg: "bg-[hsl(var(--brand-orange))]/10", title: "Confirming Payment", message: "We are confirming your payment with the gateway. This may take a few moments." },
    initiated: { icon: Clock, color: "text-[hsl(var(--brand-orange))]", bg: "bg-[hsl(var(--brand-orange))]/10", title: "Confirming Payment", message: "We are confirming your payment with the gateway. This may take a few moments." },
    cancelled: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-100", title: "Payment Cancelled", message: "This payment was cancelled." },
    expired: { icon: XCircle, color: "text-[hsl(var(--brand-orange))]", bg: "bg-[hsl(var(--brand-orange))]/10", title: "Payment Expired", message: "This payment session has expired. Please initiate a new payment." },
    reversed: { icon: AlertCircle, color: "text-[hsl(var(--brand-violet))]", bg: "bg-[hsl(var(--brand-violet))]/10", title: "Payment Reversed", message: "This payment has been reversed. Please contact your school administrator." }
  };

  const cfg = statusConfig[status] || { icon: AlertCircle, color: "text-[hsl(var(--brand-red))]", bg: "bg-[hsl(var(--brand-red))]/10", title: "Error", message: "Something went wrong. Please contact support with your transaction reference." };
  const Icon = cfg.icon;
  const isProcessing = status === "pending" || status === "initiated";
  const isSuccess = status === "success";
  const showReceipt = isSuccess && txn?.receipt_number;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--brand-indigo))] mb-4" />
        <p className="text-sm text-muted-foreground">Confirming your payment…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-red-50">
          <AlertCircle className="w-14 h-14 text-red-600 mb-4" />
          <h1 className="font-heading font-extrabold text-xl text-foreground mb-2">Error</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Link to="/app/finance" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[hsl(var(--brand-navy))] text-white text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Finance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-6">
      <div className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Status header */}
        <div className={"flex flex-col items-center text-center p-8 " + cfg.bg}>
          <div className={"w-16 h-16 rounded-full flex items-center justify-center mb-4 " + cfg.bg}>
            {isProcessing ? <Loader2 className={"w-8 h-8 animate-spin " + cfg.color} /> : <Icon className={"w-8 h-8 " + cfg.color} />}
          </div>
          <h1 className="font-heading font-extrabold text-xl text-foreground mb-1">{cfg.title}</h1>
          <p className="text-sm text-muted-foreground">{cfg.message}</p>
        </div>

        {/* Transaction details */}
        {txn && (
          <div className="p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee Amount</span>
              <span className="font-bold text-foreground">{formatCurrency(txn.amount)}</span>
            </div>
            {txn.convenience_fee > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convenience Fee ({GATEWAY_LABELS[txn.gateway] || txn.gateway} + ₦100 Split)</span>
                  <span className="font-medium text-foreground">{formatCurrency(txn.convenience_fee)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border/40">
                  <span className="font-semibold text-foreground">Total Charged</span>
                  <span className="font-extrabold text-[hsl(var(--brand-indigo))]">{formatCurrency(txn.total_payable || (Number(txn.amount) + Number(txn.convenience_fee)))}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-xs text-foreground">{txn.internal_reference}</span>
            </div>
            {txn.gateway_reference && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gateway Ref</span>
                <span className="font-mono text-xs text-foreground">{txn.gateway_reference}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gateway</span>
              <span className="text-foreground">{GATEWAY_LABELS[txn.gateway] || txn.gateway}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Student</span>
              <span className="text-foreground">{txn.student_name}</span>
            </div>
            {txn.session_name && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session</span>
                <span className="text-foreground">{txn.session_name} {txn.term_name ? "· " + txn.term_name : ""}</span>
              </div>
            )}
            {showReceipt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receipt No</span>
                <span className="font-mono text-xs text-[hsl(var(--brand-indigo))]">{txn.receipt_number}</span>
              </div>
            )}

            {/* Fee breakdown for successful payments */}
            {isSuccess && txn.allocation_plan && txn.allocation_plan.length > 0 && (
              <div className="pt-3 border-t border-border/60">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Fee Breakdown</p>
                {txn.allocation_plan.map((a, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-foreground">{a.category_name}</span>
                    <span className="text-foreground">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 p-6 pt-0">
          {showReceipt && (
            <button onClick={downloadReceipt} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[hsl(var(--brand-indigo))] hover:bg-[hsl(var(--brand-violet))] text-white text-sm font-semibold transition-colors">
              <Download className="w-4 h-4" /> Download Receipt
            </button>
          )}
          <Link to="/app/finance" className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-white hover:bg-slate-50 text-foreground text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Finance
          </Link>
        </div>
      </div>

      {/* Support info */}
      <p className="text-xs text-muted-foreground text-center mt-4 px-6">
        {isProcessing
          ? "Please do not close this page. We are waiting for confirmation from the payment gateway."
          : status === "failed"
          ? "If you believe this is an error, please contact your school administrator with your transaction reference."
          : "For questions about this payment, please contact your school administrator."}
      </p>
    </div>
  );
}