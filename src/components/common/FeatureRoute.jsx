import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

/**
 * Route guard that gracefully blocks access to disabled features for non-Super-Admins.
 */
export default function FeatureRoute({ featureKey, children, backTo = "/app", backLabel = "Back to Dashboard" }) {
  const { role, schoolId } = useCurrentUser();
  const { isFeatureEnabled, loading } = useFeatureFlags(schoolId || null);

  if (role === "super_admin") {
    return children;
  }

  if (!loading && !isFeatureEnabled(featureKey)) {
    return (
      <div className="max-w-lg mx-auto my-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-extrabold text-xl text-foreground mb-2">
          Feature Currently Unavailable
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          This module has been disabled by the platform administrator. Please contact your school administrator or platform support if you need access.
        </p>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
      </div>
    );
  }

  return children;
}
