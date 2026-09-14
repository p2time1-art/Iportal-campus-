import React, { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/finance";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";

export default function ReversePaymentDialog({ open, onClose, onConfirm, payment, loading }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open || !payment) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">Reverse Payment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Reversing <span className="font-semibold text-foreground">{formatCurrency(payment.amount)}</span> will restore outstanding balances on all allocated charges. The original record is preserved for audit.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Reason (optional)</label>
              <textarea
                className="w-full min-h-[60px] px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Bank reversal, duplicate payment, error…"
              />
            </div>
          </div>
          <div className="flex gap-2 px-5 py-4 bg-slate-50 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason || "Reversed by administrator")}
              disabled={loading}
              className="flex-1 h-10 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Reversing…</> : "Reverse Payment"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}