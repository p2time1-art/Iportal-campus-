import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", loading = false, loadingLabel = "Deleting…", error = "", icon: Icon = AlertTriangle }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">{error}</p>}
              </div>
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
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? loadingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}