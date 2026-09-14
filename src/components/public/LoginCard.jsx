import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LoginCard({ compact = false }) {
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!pin.trim() || !password) {
      setError("Please enter your Login PIN and Password.");
      return;
    }
    setLoading(true);
    try {
      // 1. Resolve the Login PIN to the user's email + role context
      const res = await base44.functions.invoke("resolveLoginPin", { login_pin: pin.trim() });
      const { email } = res.data;
      if (!email) {
        setError("Unable to resolve your Login PIN. Please contact your school administrator.");
        setLoading(false);
        return;
      }
      // 2. Authenticate with the resolved email + password (verified by the auth backend)
      await base44.auth.loginViaEmailPassword(email, password);
      // Hard redirect to dashboard (auth provider re-initializes)
      window.location.href = "/";
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.data?.error ||
        err?.message ||
        "Invalid Login PIN or Password. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${compact ? "max-w-md" : "max-w-[420px]"} mx-auto`}>
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] border border-slate-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f172a] mb-4 shadow-lg shadow-[#0f172a]/20">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-heading font-extrabold text-xl text-[#0f172a]">Login to Your Account</h2>
          <p className="text-sm text-slate-500 mt-1.5">Access your portal using your login PIN and password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login PIN */}
          <div className="space-y-1.5">
            <label htmlFor="login-pin" className="text-[13px] font-semibold text-[#0f172a]">
              Login PIN
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your login PIN"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-[13px] font-semibold text-[#0f172a]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <><Lock className="w-4 h-4" /> Login</>
            )}
          </button>
        </form>

        <div className="text-center mt-5">
          <Link to="/forgot-password" className="text-sm text-[#1e3a8a] hover:text-[#0f172a] font-medium transition-colors">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}