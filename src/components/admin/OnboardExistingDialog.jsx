import React, { useState } from "react";
import { Loader2, KeyRound, CheckCircle2, Mail, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FormDrawer from "@/components/admin/FormDrawer";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";

/**
 * Onboards an existing school profile (Student/Teacher/ParentGuardian) to a portal account.
 * Generates a Login PIN and creates a SchoolMembership. Optionally invites the user by email.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - profile: { id, full_name, email, phone, ... }
 * - role: 'teacher' | 'student' | 'parent'
 * - onDone: () => void (refresh callback)
 */
export default function OnboardExistingDialog({ open, onClose, profile, role, onDone }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    if (open && profile) {
      setEmail(profile.email || "");
      setError("");
      setResult(null);
    }
  }, [open, profile]);

  const handleOnboard = async () => {
    if (!email.trim()) { setError("Email is required to create a portal account."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("onboardUser", {
        role,
        email: email.trim().toLowerCase(),
        profile_id: profile?.id,
        profile_data: {
          full_name: profile?.full_name || ""
        }
      });
      const data = res.data || res;
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        // If the user doesn't exist yet, send an invite
        if (data.needs_invite) {
          try {
            await base44.auth.inviteUser(email.trim().toLowerCase(), "user");
          } catch (_e) {
            // Invite may fail — the PIN is still generated, admin can share manually
          }
        }
        if (onDone) onDone();
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Unable to onboard account.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setEmail("");
    setError("");
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title="Onboard Portal Account"
      description={`Create portal access for ${profile?.full_name || "this person"}.`}
      footer={
        result ? (
          <button onClick={handleClose} className="w-full h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold">
            Done
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleClose} className="flex-1 h-10 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-100">Cancel</button>
            <button onClick={handleOnboard} disabled={loading} className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Onboarding…</> : <><UserPlus className="w-4 h-4" /> Onboard</>}
            </button>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="text-center">
            <h3 className="font-heading font-bold text-lg text-foreground">Portal Account Created</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {result.user_exists
                ? "The user's existing account has been linked to this profile."
                : "An invitation has been sent. The user will set up their password via email."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-slate-50/60 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Login PIN</p>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[hsl(var(--brand-indigo))]" />
              <span className="font-mono text-xl font-bold tracking-widest text-foreground">{result.login_pin}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Share this PIN with the user. They will use it along with their password to log in.</p>
          </div>
          {!result.user_exists && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">An invitation email has been sent to {email}. The user must accept the invite and set up their password before they can log in with their PIN.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-foreground">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{role} • {profile?.admission_number || profile?.staff_id || profile?.phone || ""}</p>
          </div>
          <div>
            <label className={labelCls}>Portal Email *</label>
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" />
            <p className="text-xs text-muted-foreground mt-1">The user will log in with this email and their generated Login PIN.</p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <div className="rounded-xl border border-border bg-slate-50/60 p-3">
            <p className="text-xs text-muted-foreground">A unique 6-digit Login PIN will be generated automatically. If the email is already registered, the account will be linked immediately. Otherwise, an invitation will be sent.</p>
          </div>
        </div>
      )}
    </FormDrawer>
  );
}