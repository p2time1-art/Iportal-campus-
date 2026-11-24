import React, { useEffect, useState } from "react";
import { Loader2, Settings2, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function GatewayConfigCard() {
  const { schoolId } = useCurrentUser();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const activeGw = config?.gateway || "paystack";
  const webhookUrl = `${window.location.origin}/api/v1/webhooks/${activeGw}`;

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("manageGatewayConfig", { action: "get", school_id: schoolId });
        setConfig(res.data);
      } catch (_e) {
        setConfig(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [schoolId]);

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-3"><Loader2 className="w-4 h-4 animate-spin" /> Loading gateway settings…</div>;
  }

  const isConfigured = config?.status === 'configured';
  const isEnabled = config?.enabled ?? false;

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-heading font-bold text-sm text-foreground">Gateway Configuration</h3>
      </div>

      {isConfigured ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${isEnabled ? "bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]" : "bg-gray-100 text-gray-500"}`}>
              {isEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Gateway:</span>
            <span className="text-xs font-semibold text-foreground capitalize">{config.gateway || "Paystack"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Platform Split Fee:</span>
            <span className="text-xs font-semibold text-foreground">₦{Number(config.platform_fee ?? 100).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Environment:</span>
            <span className="text-xs font-semibold text-foreground capitalize">{config.environment || "Test"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Currency:</span>
            <span className="text-xs font-semibold text-foreground">{config.currency || "NGN"}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Online payments have not been configured for this school. Please contact the platform administrator.</p>
      )}

      <div className="mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Webhook URL:</span>
          <code className="text-xs text-foreground bg-slate-50 px-2 py-1 rounded font-mono flex-1 truncate">{webhookUrl}</code>
          <button onClick={copyWebhookUrl} className="p-1.5 rounded hover:bg-slate-100 text-muted-foreground" aria-label="Copy webhook URL">
            {copied ? <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-green))]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}