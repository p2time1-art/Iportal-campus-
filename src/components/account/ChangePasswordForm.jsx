import React, { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authApi } from "@/api/auth";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";

export default function ChangePasswordForm({ onSuccess }) {
  const { user } = useCurrentUser();
  const { checkUserAuth } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      await checkUserAuth();
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onSuccess) setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setError(err.message || "Failed to change password. Please check your current password and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Password changed successfully! Your PIN remains your platform identifier.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Current Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password or PIN"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your current account password.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">New Password</label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Confirm New Password</label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showNew ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            className="w-full h-10 pl-10 pr-10 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
            autoComplete="new-password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || success}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        {loading ? "Changing…" : "Change Password"}
      </button>
    </form>
  );
}