import React, { useState, useEffect } from "react";
import { Loader2, KeyRound, CheckCircle2, Mail, UserPlus, GraduationCap, Users, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FormDrawer from "@/components/admin/FormDrawer";

const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30";
const labelCls = "text-sm font-semibold text-foreground mb-1.5 block";
const roleTabs = [
  { key: "teacher", label: "Teacher", icon: BookOpen },
  { key: "student", label: "Student", icon: GraduationCap },
  { key: "parent", label: "Parent", icon: Users },
];

export default function OnboardingDrawer({ open, onClose, schoolId, schoolName, classes, sessions, students, onDone }) {
  const [step, setStep] = useState("form");
  const [role, setRole] = useState("teacher");
  const [form, setForm] = useState({
    email: "", full_name: "", staff_id: "", admission_number: "",
    phone: "", gender: "", qualification: "", relationship: "guardian",
    occupation: "", current_class_id: "", current_session_id: ""
  });
  const [guardianLinks, setGuardianLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setRole("teacher");
      setForm({
        email: "", full_name: "", staff_id: "", admission_number: "",
        phone: "", gender: "", qualification: "", relationship: "guardian",
        occupation: "", current_class_id: "", current_session_id: ""
      });
      setGuardianLinks([]);
      setError("");
      setResult(null);
    }
  }, [open]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    if (!form.email.trim()) return "Email is required.";
    if (!form.full_name.trim()) return "Full name is required.";
    if (role === "teacher" && !form.staff_id.trim()) return "Staff ID is required.";
    if (role === "student" && !form.admission_number.trim()) return "Admission number is required.";
    if (role === "parent" && (!form.phone || !form.phone.trim())) return "Phone is required for parents.";
    return null;
  };

  const handleOnboard = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        role,
        email: form.email.trim().toLowerCase(),
        profile_data: {
          full_name: form.full_name.trim(),
          staff_id: form.staff_id?.trim() || undefined,
          admission_number: form.admission_number?.trim() || undefined,
          phone: form.phone?.trim() || undefined,
          gender: form.gender || undefined,
          qualification: form.qualification?.trim() || undefined,
          relationship: form.relationship || undefined,
          occupation: form.occupation?.trim() || undefined,
          current_class_id: form.current_class_id || undefined,
          current_session_id: form.current_session_id || undefined,
          session_name: sessions?.find((s) => s.id === form.current_session_id)?.name || undefined
        }
      };
      if (role === "parent" && guardianLinks.length > 0) {
        payload.guardian_links = guardianLinks.map((l) => ({
          student_id: l.student_id,
          relationship_type: l.relationship_type || "guardian",
          is_primary: l.is_primary || false
        }));
      }
      const res = await base44.functions.invoke("onboardUser", payload);
      const data = res.data || res;
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        setStep("result");
        if (data.needs_invite) {
          try { await base44.users.inviteUser(form.email.trim().toLowerCase(), "user"); } catch (_e) {}
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
    setStep("form");
    setResult(null);
    setError("");
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onClose={handleClose}
      title="Onboard Portal Account"
      description={schoolName ? `Create a portal account at ${schoolName}` : "Create a new portal account"}
      footer={
        step === "result" ? (
          <button onClick={handleClose} className="w-full h-10 rounded-lg bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-light))] text-white text-sm font-semibold">Done</button>
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
      {step === "result" && result ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="text-center">
            <h3 className="font-heading font-bold text-lg text-foreground">Portal Account Created</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {result.user_exists ? "The user's existing account has been linked to this profile." : "An invitation has been sent. The user will set up their password via email."}
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
              <p className="text-xs text-amber-700">An invitation email has been sent to {form.email}. The user must accept the invite and set up their password before they can log in with their PIN.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Role selection */}
          <div>
            <label className={labelCls}>Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              {roleTabs.map((t) => {
                const Icon = t.icon;
                const active = role === t.key;
                return (
                  <button key={t.key} onClick={() => setRole(t.key)} className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-colors ${active ? "border-[hsl(var(--brand-indigo))] bg-[hsl(var(--brand-indigo-light))] text-[hsl(var(--brand-indigo))]" : "border-border bg-white text-muted-foreground hover:bg-slate-50"}`}>
                    <Icon className="w-5 h-5" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Common fields */}
          <div>
            <label className={labelCls}>Full Name *</label>
            <input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className={labelCls}>Portal Email *</label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="user@email.com" />
          </div>

          {/* Role-specific fields */}
          {role === "teacher" && (
            <>
              <div>
                <label className={labelCls}>Staff ID *</label>
                <input className={inputCls} value={form.staff_id} onChange={(e) => update("staff_id", e.target.value)} placeholder="e.g. STF001" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone" />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select className={inputCls} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                    <option value="">—</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Qualification</label>
                <input className={inputCls} value={form.qualification} onChange={(e) => update("qualification", e.target.value)} placeholder="e.g. B.Ed Mathematics" />
              </div>
            </>
          )}

          {role === "student" && (
            <>
              <div>
                <label className={labelCls}>Admission Number *</label>
                <input className={inputCls} value={form.admission_number} onChange={(e) => update("admission_number", e.target.value)} placeholder="e.g. ADM001" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone" />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select className={inputCls} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                    <option value="">—</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Assign to Class</label>
                <select className={inputCls} value={form.current_class_id} onChange={(e) => update("current_class_id", e.target.value)}>
                  <option value="">— No class —</option>
                  {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Academic Session</label>
                <select className={inputCls} value={form.current_session_id} onChange={(e) => update("current_session_id", e.target.value)}>
                  <option value="">— Select session —</option>
                  {sessions?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </>
          )}

          {role === "parent" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone" />
                </div>
                <div>
                  <label className={labelCls}>Relationship</label>
                  <select className={inputCls} value={form.relationship} onChange={(e) => update("relationship", e.target.value)}>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Occupation</label>
                <input className={inputCls} value={form.occupation} onChange={(e) => update("occupation", e.target.value)} placeholder="Occupation" />
              </div>
              {/* Student links */}
              <div>
                <label className={labelCls}>Linked Children</label>
                <div className="space-y-2">
                  {guardianLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select className={`${inputCls} flex-1`} value={link.student_id} onChange={(e) => setGuardianLinks((p) => p.map((l, i) => i === idx ? { ...l, student_id: e.target.value } : l))}>
                        <option value="">— Select student —</option>
                        {students?.filter((s) => !guardianLinks.some((l, i) => i !== idx && l.student_id === s.id)).map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}
                      </select>
                      <button onClick={() => setGuardianLinks((p) => p.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-sm px-2">Remove</button>
                    </div>
                  ))}
                  <button onClick={() => setGuardianLinks((p) => [...p, { student_id: "", relationship_type: "guardian", is_primary: false }])} className="text-sm font-semibold text-[hsl(var(--brand-indigo))] hover:underline">+ Add child</button>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
      )}
    </FormDrawer>
  );
}