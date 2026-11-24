import React from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import { Shield, AlertTriangle } from "lucide-react";

export default function ChangePassword() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight mb-1">Change Password</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Set a new password for your account. Your PIN remains your platform identifier.
      </p>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Password Change Required</p>
          <p className="text-sm text-amber-700 mt-0.5">
            For security, please change your initial PIN password to a personal password of your choice.
            You will not be able to access other pages until this is complete.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-navy))] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-foreground">Account Security</h2>
            <p className="text-xs text-muted-foreground">Your new password must be at least 6 characters.</p>
          </div>
        </div>
        <ChangePasswordForm onSuccess={() => navigate("/app")} />
      </div>
    </div>
  );
}