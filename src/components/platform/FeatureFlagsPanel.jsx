import React, { useState, useEffect, useCallback } from "react";
import { Sliders, Loader2, RotateCcw, CheckCircle2, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/api/client";
import { invalidateFeatureFlagsCache } from "@/hooks/useFeatureFlags";

/**
 * Super Admin Feature Management Panel.
 * - When schoolId is omitted/null: manages Platform-Wide default feature flags.
 * - When schoolId is provided: manages per-school overrides (with reset-to-default).
 */
export default function FeatureFlagsPanel({ schoolId = null, schoolName = "" }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const isSchoolScope = Boolean(schoolId);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = isSchoolScope ? `?school_id=${encodeURIComponent(schoolId)}` : "?school_id=global";
      const res = await apiRequest(`/feature-flags${qs}`);
      setFeatures(res?.data?.features || []);
    } catch (e) {
      setError(e?.message || "Unable to load feature flags.");
    } finally {
      setLoading(false);
    }
  }, [isSchoolScope, schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (feature) => {
    const nextEnabled = isSchoolScope ? !feature.is_enabled : !feature.platform_enabled;
    setBusyKey(feature.key);
    setError("");
    setFeedback("");
    try {
      const res = await apiRequest("/feature-flags/toggle", {
        method: "POST",
        body: {
          feature_key: feature.key,
          is_enabled: nextEnabled,
          ...(isSchoolScope ? { school_id: Number(schoolId) } : {}),
        },
      });
      setFeatures(res?.data?.features || []);
      invalidateFeatureFlagsCache();
      setFeedback(`${feature.label} ${nextEnabled ? "enabled" : "disabled"}${isSchoolScope ? ` for ${schoolName || "this school"}` : " platform-wide"}.`);
      setTimeout(() => setFeedback(""), 3500);
    } catch (e) {
      setError(e?.message || "Failed to update feature flag.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleResetOverride = async (feature) => {
    if (!isSchoolScope) return;
    setBusyKey(feature.key);
    setError("");
    setFeedback("");
    try {
      const res = await apiRequest("/feature-flags/toggle", {
        method: "POST",
        body: {
          feature_key: feature.key,
          school_id: Number(schoolId),
          reset_override: true,
        },
      });
      setFeatures(res?.data?.features || []);
      invalidateFeatureFlagsCache();
      setFeedback(`${feature.label} reset to platform default.`);
      setTimeout(() => setFeedback(""), 3500);
    } catch (e) {
      setError(e?.message || "Failed to reset override.");
    } finally {
      setBusyKey(null);
    }
  };

  const enabledCount = features.filter((f) => (isSchoolScope ? f.is_enabled : f.platform_enabled)).length;

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))] flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-foreground">
              {isSchoolScope ? `School Feature Overrides${schoolName ? ` — ${schoolName}` : ""}` : "Platform-Wide Feature Control"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isSchoolScope
                ? "Override platform defaults to enable or disable specific modules for this school."
                : "Enable or disable core modules globally across all schools on the platform."}
            </p>
          </div>
        </div>
        {!loading && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-foreground">
            {enabledCount} / {features.length} Enabled
          </span>
        )}
      </div>

      {feedback && (
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {feedback}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading feature flags…
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {features.map((f) => {
            const checked = isSchoolScope ? f.is_enabled : f.platform_enabled;
            const isBusy = busyKey === f.key;
            return (
              <div key={f.key} className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{f.label}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {f.category}
                    </span>
                    {isSchoolScope && f.has_school_override && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Custom Override
                      </span>
                    )}
                    {isSchoolScope && !f.has_school_override && (
                      <span className="text-[10px] text-muted-foreground">
                        Inherits Platform ({f.platform_enabled ? "On" : "Off"})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {isSchoolScope && f.has_school_override && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleResetOverride(f)}
                      title="Reset to platform default"
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-white hover:bg-slate-50 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={isBusy}
                    onClick={() => handleToggle(f)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/40 disabled:opacity-50 ${
                      checked ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        checked ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
