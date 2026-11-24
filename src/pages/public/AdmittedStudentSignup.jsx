import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import { UserPlus, Loader2, AlertCircle, CheckCircle2, KeyRound, Copy, Check } from "lucide-react";

const inputCls = "w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors";
const labelCls = "text-[13px] font-semibold text-[#0f172a] mb-1.5 block";

export default function AdmittedStudentSignup() {
  const [form, setForm] = useState({ application_number: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!form.application_number.trim() || !form.email.trim()) {
      setError("Please enter your application number and email.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("admittedStudentSignup", {
        application_number: form.application_number.trim(),
        email: form.email.trim()
      });
      setResult(res.data || res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicPageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0f172a] mb-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-[#1a2336] mb-2">Admitted Student Sign Up</h1>
          <p className="text-slate-500">If your application has been accepted, sign up here to create your student portal account.</p>
        </div>

        {result ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-2">Account Created!</h2>
            <p className="text-slate-500 mb-6">{result.message}</p>

            {result.login_pin && (
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Your Login PIN</p>
                    <p className="font-mono text-lg font-bold text-[#0f172a] tracking-wider">{result.login_pin}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(result.login_pin); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-slate-50"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {result.admission_number && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Admission Number</p>
                <p className="font-mono text-lg font-bold text-[#0f172a] tracking-wider">{result.admission_number}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Please save your Login PIN. You will need it to log in. You will be prompted to change your password on first login.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all">
                Go to Login
              </Link>
              <Link to="/" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-slate-200 text-[#0f172a] hover:bg-slate-50 font-semibold text-sm transition-all">
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <label className={labelCls}>Application Number *</label>
              <input
                className={inputCls}
                value={form.application_number}
                onChange={(e) => setForm({ ...form, application_number: e.target.value })}
                placeholder="e.g., APP-XXXXX-XXXXXX"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Email Address *</label>
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="The email you used in your application"
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              Your application must have been accepted or admitted. The email must match the email used in your application.
            </p>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : <><UserPlus className="w-4 h-4" /> Sign Up</>}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/applications/status" className="text-sm font-semibold text-[#0f172a] hover:text-[#f97316]">Check your application status →</Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}