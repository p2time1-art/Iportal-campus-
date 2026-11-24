import React, { useEffect, useState } from "react";
import { Shield, Loader2, Check, X, KeyRound, Plug, Power, PowerOff, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GatewayManagementPanel({ schoolId, schoolName }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("paystack");
  const [form, setForm] = useState({ secret_key: "", public_key: "", webhook_secret: "", subaccount_code: "", contract_code: "", merchant_id: "", service_type_id: "", platform_fee: "100", environment: "test" });
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/v1/webhooks/${selectedGateway}`;

  const load = async (gw = selectedGateway) => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manageGatewayConfig", { action: "get", school_id: schoolId, gateway_name: gw });
      setConfig(res.data);
      if (res.data?.environment) {
        setForm(f => ({
          ...f,
          environment: res.data.environment,
          subaccount_code: res.data.subaccount_code || "",
          contract_code: res.data.contract_code || "",
          merchant_id: res.data.merchant_id || "",
          service_type_id: res.data.service_type_id || "",
          platform_fee: String(res.data.platform_fee ?? 100),
        }));
      }
    } catch (_e) {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(selectedGateway); }, [schoolId, selectedGateway]);

  const handleSave = async () => {
    if (!form.secret_key || !form.public_key) return;
    setSaving(true);
    setTestResult(null);
    try {
      await base44.functions.invoke("manageGatewayConfig", {
        action: "save",
        school_id: schoolId,
        gateway_name: selectedGateway,
        secret_key: form.secret_key,
        public_key: form.public_key,
        webhook_secret: form.webhook_secret,
        subaccount_code: form.subaccount_code,
        contract_code: form.contract_code,
        merchant_id: form.merchant_id,
        service_type_id: form.service_type_id,
        platform_fee: Number(form.platform_fee) || 100,
        environment: form.environment,
      });
      setForm(f => ({ ...f, secret_key: "", public_key: "", webhook_secret: "" }));
      setShowCredentialForm(false);
      await load(selectedGateway);
    } catch (_e) { /* non-fatal */ }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("manageGatewayConfig", {
        action: "test",
        school_id: schoolId,
        gateway_name: selectedGateway,
        ...(form.secret_key ? { secret_key: form.secret_key } : {}),
      });
      setTestResult(res.data);
    } catch (_e) {
      setTestResult({ status: 'failed', message: 'The gateway credentials could not be verified.' });
    } finally { setTesting(false); }
  };

  const handleEnable = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("manageGatewayConfig", { action: "enable", school_id: schoolId, gateway_name: selectedGateway });
      await load();
    } catch (_e) { /* non-fatal */ }
    finally { setSaving(false); }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("manageGatewayConfig", { action: "disable", school_id: schoolId, gateway_name: selectedGateway });
      await load();
    } catch (_e) { /* non-fatal */ }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!confirm('Remove all gateway credentials? This will disable online payments for this school.')) return;
    setSaving(true);
    try {
      await base44.functions.invoke("manageGatewayConfig", { action: "remove", school_id: schoolId, gateway_name: selectedGateway });
      await load();
    } catch (_e) { /* non-fatal */ }
    finally { setSaving(false); }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading gateway configuration…</div>;
  }

  const isConfigured = config?.status === 'configured';
  const hasCredentials = config?.has_credentials;
  const isEnabled = config?.enabled;
  const showForm = showCredentialForm || !hasCredentials;

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
          <h3 className="font-heading font-bold text-base text-foreground">Payment Gateway & Split Management</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "paystack", label: "Paystack" },
            { key: "flutterwave", label: "Flutterwave" },
            { key: "monnify", label: "Monnify" },
            { key: "remita", label: "Remita" },
          ].map((gw) => (
            <button
              key={gw.key}
              type="button"
              onClick={() => { setSelectedGateway(gw.key); setTestResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selectedGateway === gw.key ? "border-[hsl(var(--brand-indigo))] bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))]" : "border-border bg-white text-muted-foreground"}`}
            >
              {gw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status overview */}
      {isConfigured ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-secondary/40">
            <span className="text-xs text-muted-foreground">Gateway</span>
            <span className="text-sm font-semibold text-foreground capitalize">{config.gateway || selectedGateway}</span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-secondary/40">
            <span className="text-xs text-muted-foreground">Environment</span>
            <span className="text-sm font-semibold text-foreground capitalize">{config.environment}</span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-secondary/40">
            <span className="text-xs text-muted-foreground">Credentials</span>
            <span className={`text-sm font-semibold ${hasCredentials ? 'text-[hsl(var(--brand-green))]' : 'text-muted-foreground'}`}>
              {hasCredentials ? '✓ Configured' : 'Not Set'}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-secondary/40">
            <span className="text-xs text-muted-foreground">Online Payments</span>
            <span className={`text-sm font-semibold ${isEnabled ? 'text-[hsl(var(--brand-green))]' : 'text-muted-foreground'}`}>
              {isEnabled ? '✓ Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 mb-5">
          <p className="text-sm text-orange-700">This school has not been configured for online payments yet. Enter Paystack credentials below to get started.</p>
        </div>
      )}

      {/* Last test result */}
      {config?.last_test_status && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${config.last_test_status === 'success' ? 'bg-[hsl(var(--brand-green))]/5 text-[hsl(var(--brand-green))]' : 'bg-red-50 text-red-600'}`}>
          {config.last_test_status === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span className="text-sm font-medium">{config.last_test_message}</span>
          {config.last_tested_at && <span className="text-xs ml-auto text-muted-foreground">{new Date(config.last_tested_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
        </div>
      )}

      {/* Current test result */}
      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${testResult.status === 'success' ? 'bg-[hsl(var(--brand-green))]/5 text-[hsl(var(--brand-green))]' : 'bg-red-50 text-red-600'}`}>
          {testResult.status === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span className="text-sm font-medium">{testResult.message}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Environment selector */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Environment</label>
          <div className="flex gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, environment: 'test' }))}
              className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors ${form.environment === 'test' ? 'border-[hsl(var(--brand-indigo))] bg-[hsl(var(--brand-indigo))]/5 text-[hsl(var(--brand-indigo))]' : 'border-border bg-white text-muted-foreground'}`}
            >
              Test / Sandbox
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, environment: 'live' }))}
              className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors ${form.environment === 'live' ? 'border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/5 text-[hsl(var(--brand-orange))]' : 'border-border bg-white text-muted-foreground'}`}
            >
              Live / Production
            </button>
          </div>
        </div>

        {/* Credential inputs or masked display */}
        {hasCredentials && !showCredentialForm ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/40">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Secret Key:</span>
              <span className="text-sm font-semibold text-foreground">Configured ✓</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/40">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Public Key:</span>
              <span className="text-sm font-semibold text-foreground">Configured ✓</span>
            </div>
            {config?.webhook_secret_configured && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/40">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Webhook Secret:</span>
                <span className="text-sm font-semibold text-foreground">Configured ✓</span>
              </div>
            )}
            <button onClick={() => setShowCredentialForm(true)} className="text-sm text-[hsl(var(--brand-indigo))] hover:underline font-medium">
              Replace credentials
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Public Key</label>
              <input
                type="text"
                value={form.public_key}
                onChange={e => setForm(f => ({ ...f, public_key: e.target.value }))}
                placeholder={form.environment === 'test' ? 'pk_test_…' : 'pk_live_…'}
                className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                {selectedGateway === "remita" ? "Remita API Key / Secret Key" : "Secret Key"}
              </label>
              <input
                type="password"
                value={form.secret_key}
                onChange={e => setForm(f => ({ ...f, secret_key: e.target.value }))}
                placeholder={selectedGateway === "remita" ? "Remita API Key" : (form.environment === 'test' ? 'sk_test_…' : 'sk_live_…')}
                className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
              />
            </div>
            {selectedGateway === "remita" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Remita Merchant ID</label>
                  <input
                    type="text"
                    value={form.merchant_id}
                    onChange={e => setForm(f => ({ ...f, merchant_id: e.target.value }))}
                    placeholder="e.g. 2547916"
                    className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Remita Service Type ID</label>
                  <input
                    type="text"
                    value={form.service_type_id}
                    onChange={e => setForm(f => ({ ...f, service_type_id: e.target.value }))}
                    placeholder="e.g. 4430731"
                    className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">School Subaccount / Split Code <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={form.subaccount_code}
                  onChange={e => setForm(f => ({ ...f, subaccount_code: e.target.value }))}
                  placeholder="e.g. ACCT_xxxxxxxxx"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Platform Convenience Split Fee (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={form.platform_fee}
                  onChange={e => setForm(f => ({ ...f, platform_fee: e.target.value }))}
                  placeholder="100"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Webhook Secret <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input
                type="password"
                value={form.webhook_secret}
                onChange={e => setForm(f => ({ ...f, webhook_secret: e.target.value }))}
                placeholder="Gateway webhook signing secret"
                className="w-full h-10 px-3 rounded-lg bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
              />
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {showForm ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving || !form.secret_key || !form.public_key}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Configuration'}
              </button>
              <button
                onClick={handleTest}
                disabled={testing || !form.secret_key}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                {testing ? 'Testing…' : 'Test Connection'}
              </button>
              {hasCredentials && (
                <button onClick={() => setShowCredentialForm(false)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">
                  Cancel
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-white hover:bg-slate-50 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                {testing ? 'Testing…' : 'Test Connection'}
              </button>
              {isEnabled ? (
                <button
                  onClick={handleDisable}
                  disabled={saving}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <PowerOff className="w-4 h-4" /> Disable Payments
                </button>
              ) : (
                <button
                  onClick={handleEnable}
                  disabled={saving || !hasCredentials}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[hsl(var(--brand-green))] hover:bg-[hsl(var(--brand-green))]/90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Power className="w-4 h-4" /> Enable Payments
                </button>
              )}
              <button onClick={handleRemove} disabled={saving} className="text-sm text-red-600 hover:underline px-3 py-2">
                Remove Credentials
              </button>
            </>
          )}
        </div>

        {/* Webhook URL */}
        <div className="pt-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Webhook URL:</span>
            <code className="text-xs text-foreground bg-slate-50 px-2 py-1 rounded font-mono flex-1 truncate">{webhookUrl}</code>
            <button onClick={copyWebhookUrl} className="p-1.5 rounded hover:bg-slate-100 text-muted-foreground" aria-label="Copy">
              {copied ? <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-green))]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Register this URL in the school's Paystack dashboard → Settings → API Keys & Webhooks.</p>
        </div>
      </div>
    </div>
  );
}