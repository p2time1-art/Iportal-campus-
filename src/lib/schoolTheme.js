import { useState, useEffect } from "react";
import { apiRequest } from "@/api/client";

export const DEFAULT_SCHOOL_COLORS = {
  primary_color: "#0f172a",
  accent_color: "#4f46e5",
  secondary_color: "#f97316",
  sidebar_color: "#0f172a",
  success_color: "#22c55e",
  violet_color: "#7c3aed",
};

/**
 * Converts a #RRGGBB hex string into a CSS HSL triplet "H S% L%" compatible with
 * Tailwind's `hsl(var(--...))` tokens.
 */
export function hexToHslTriplet(hex, lightnessDelta = 0) {
  if (!hex || typeof hex !== "string") return null;
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.max(4, Math.min(96, Math.round(l * 100) + lightnessDelta));

  return `${hDeg} ${sPct}% ${lPct}%`;
}

/**
 * Applies a school's custom color palette live to CSS custom properties on :root.
 */
export function applySchoolTheme(colors = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  const merged = { ...DEFAULT_SCHOOL_COLORS, ...(colors || {}) };

  const primary = hexToHslTriplet(merged.primary_color);
  const primaryLight = hexToHslTriplet(merged.primary_color, 7);
  const accent = hexToHslTriplet(merged.accent_color);
  const accentLight = hexToHslTriplet(merged.accent_color, 38);
  const secondary = hexToHslTriplet(merged.secondary_color);
  const sidebarBg = hexToHslTriplet(merged.sidebar_color || merged.primary_color);
  const sidebarAccent = hexToHslTriplet(merged.sidebar_color || merged.primary_color, 7);
  const sidebarBorder = hexToHslTriplet(merged.sidebar_color || merged.primary_color, 11);
  const success = hexToHslTriplet(merged.success_color);
  const violet = hexToHslTriplet(merged.violet_color);

  if (primary) {
    root.setProperty("--brand-navy", primary);
    root.setProperty("--primary", primary);
  }
  if (primaryLight) root.setProperty("--brand-navy-light", primaryLight);
  if (accent) {
    root.setProperty("--brand-indigo", accent);
    root.setProperty("--accent", accent);
    root.setProperty("--ring", accent);
    root.setProperty("--sidebar-primary", accent);
    root.setProperty("--sidebar-ring", accent);
  }
  if (accentLight) root.setProperty("--brand-indigo-light", accentLight);
  if (secondary) root.setProperty("--brand-orange", secondary);
  if (violet) root.setProperty("--brand-violet", violet);
  if (success) root.setProperty("--brand-green", success);
  if (sidebarBg) root.setProperty("--sidebar-background", sidebarBg);
  if (sidebarAccent) root.setProperty("--sidebar-accent", sidebarAccent);
  if (sidebarBorder) root.setProperty("--sidebar-border", sidebarBorder);
}

let cachedTenantSchool = null;
let cachedPlatformSettings = null;

export function notifySchoolBrandingUpdated(updatedSchool = null) {
  if (updatedSchool) {
    cachedTenantSchool = updatedSchool;
    applySchoolTheme(updatedSchool);
  } else {
    cachedTenantSchool = null;
  }
  try {
    window.dispatchEvent(new CustomEvent("iportal:school-branding-updated", { detail: updatedSchool }));
  } catch (_e) {}
}

export function notifyPlatformSettingsUpdated(updatedPlatform = null) {
  if (updatedPlatform) {
    cachedPlatformSettings = updatedPlatform;
    applySchoolTheme(updatedPlatform);
  } else {
    cachedPlatformSettings = null;
  }
  try {
    window.dispatchEvent(new CustomEvent("iportal:platform-settings-updated", { detail: updatedPlatform }));
  } catch (_e) {}
}

/**
 * Resolves the active school tenant's branding (name, logo, motto, colors)
 * for public pages (Navbar) and school dashboards.
 * Pass { enabled: false } on Super Admin views to enforce strict theme isolation.
 */
export function useTenantBranding({ enabled = true } = {}) {
  const [school, setSchool] = useState(enabled ? cachedTenantSchool : null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    const fetchBranding = async (force = false) => {
      if (!force && cachedTenantSchool) {
        applySchoolTheme(cachedTenantSchool);
        if (mounted) setSchool(cachedTenantSchool);
        return;
      }
      try {
        const res = await apiRequest("/tenant/resolve");
        const data = res?.data || res || null;
        if (data) {
          cachedTenantSchool = data;
          applySchoolTheme(data);
          if (mounted) setSchool(data);
        }
      } catch (_e) {
        // Keep defaults if no tenant resolved
      }
    };

    fetchBranding(false);

    const onUpdated = (e) => {
      if (!enabled) return;
      if (e?.detail) {
        cachedTenantSchool = e.detail;
        applySchoolTheme(e.detail);
        if (mounted) setSchool(e.detail);
      } else {
        fetchBranding(true);
      }
    };
    window.addEventListener("iportal:school-branding-updated", onUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("iportal:school-branding-updated", onUpdated);
    };
  }, [enabled]);

  return enabled ? school : null;
}

/**
 * Loads and applies Super Admin Platform Settings exclusively for Super Admin views,
 * isolating Super Admin from any school-level branding or color overrides.
 */
export function usePlatformSettings({ enabled = false } = {}) {
  const [settings, setSettings] = useState(enabled ? cachedPlatformSettings : null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    // Immediately isolate from any previously-applied school colors
    applySchoolTheme(cachedPlatformSettings || DEFAULT_SCHOOL_COLORS);

    const fetchSettings = async (force = false) => {
      if (!force && cachedPlatformSettings) {
        applySchoolTheme(cachedPlatformSettings);
        if (mounted) setSettings(cachedPlatformSettings);
        return;
      }
      try {
        const res = await apiRequest("/platform/settings");
        const data = res?.data || null;
        if (data) {
          cachedPlatformSettings = data;
          applySchoolTheme(data);
          if (mounted) setSettings(data);
        }
      } catch (_e) {
        applySchoolTheme(DEFAULT_SCHOOL_COLORS);
      }
    };

    fetchSettings(false);

    const onUpdated = (e) => {
      if (!enabled) return;
      if (e?.detail) {
        cachedPlatformSettings = e.detail;
        applySchoolTheme(e.detail);
        if (mounted) setSettings(e.detail);
      } else {
        fetchSettings(true);
      }
    };
    window.addEventListener("iportal:platform-settings-updated", onUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("iportal:platform-settings-updated", onUpdated);
    };
  }, [enabled]);

  return enabled ? settings : null;
}
