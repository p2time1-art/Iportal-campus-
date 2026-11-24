import React from "react";
import { Sliders } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FeatureFlagsPanel from "@/components/platform/FeatureFlagsPanel";

export default function FeatureManagement() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Feature Flags & Module Control"
        subtitle="Enable or disable platform modules globally. Individual school overrides can also be managed inside each School Profile."
        icon={Sliders}
      />
      <FeatureFlagsPanel />
    </div>
  );
}
