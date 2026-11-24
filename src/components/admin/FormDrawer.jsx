import React from "react";
import { X } from "lucide-react";

export default function FormDrawer({ open, onClose, title, description = "", children, footer = undefined }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed right-0 inset-y-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-5 h-16 border-b border-border shrink-0">
          <div>
            <h2 className="font-heading font-bold text-base text-foreground leading-tight">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-border p-4 shrink-0">{footer}</div>}
      </div>
    </>
  );
}