import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/api/client";

const flagCache = new Map();

export function invalidateFeatureFlagsCache() {
  flagCache.clear();
  try {
    window.dispatchEvent(new CustomEvent("iportal:feature-flags-updated"));
  } catch (_e) {}
}

/**
 * Resolves effective feature flags for a school (or platform-wide if schoolId is null/global).
 */
export function useFeatureFlags(schoolId = null) {
  const cacheKey = schoolId ? String(schoolId) : "global";
  const cached = flagCache.get(cacheKey);

  const [flags, setFlags] = useState(cached?.flags || {});
  const [features, setFeatures] = useState(cached?.features || []);
  const [loading, setLoading] = useState(!cached);

  const fetchFlags = useCallback(async (force = false) => {
    if (!force && flagCache.has(cacheKey)) {
      const c = flagCache.get(cacheKey);
      setFlags(c.flags);
      setFeatures(c.features);
      setLoading(false);
      return;
    }
    try {
      const qs = schoolId ? `?school_id=${encodeURIComponent(schoolId)}` : "?school_id=global";
      const res = await apiRequest(`/feature-flags${qs}`);
      const data = res?.data || {};
      const nextFlags = data.flags || {};
      const nextFeatures = data.features || [];
      flagCache.set(cacheKey, { flags: nextFlags, features: nextFeatures });
      setFlags(nextFlags);
      setFeatures(nextFeatures);
    } catch (_e) {
      // Fail open on network error so UI doesn't lock out
    } finally {
      setLoading(false);
    }
  }, [cacheKey, schoolId]);

  useEffect(() => {
    fetchFlags(false);
    const onUpdated = () => fetchFlags(true);
    window.addEventListener("iportal:feature-flags-updated", onUpdated);
    return () => window.removeEventListener("iportal:feature-flags-updated", onUpdated);
  }, [fetchFlags]);

  const isFeatureEnabled = useCallback(
    (featureKey) => {
      if (!featureKey) return true;
      if (Object.prototype.hasOwnProperty.call(flags, featureKey)) {
        return Boolean(flags[featureKey]);
      }
      return true;
    },
    [flags]
  );

  return { flags, features, loading, isFeatureEnabled, refresh: () => fetchFlags(true) };
}
