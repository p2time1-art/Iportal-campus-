import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/AuthContext";
import { applyLaravelValidationErrors } from "@/lib/laravelValidation";

const loginPinSchema = z.object({
  pin: z.string().trim().min(1, "Please enter your Login PIN or Email"),
  password: z.string().min(1, "Please enter your password"),
});

export default function LoginCard({ compact = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginPinSchema),
    defaultValues: { pin: "", password: "" },
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login({ pin: values.pin.trim(), password: values.password });
      navigate("/app", { replace: true });
    } catch (err) {
      const msg = applyLaravelValidationErrors(err, setError);
      setServerError(msg || "Invalid Login PIN or Password. Please try again.");
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                {...register("pin")}
                placeholder="Enter your login PIN"
                className={`w-full h-12 pl-10 pr-4 rounded-xl border ${
                  errors.pin ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-slate-50/50"
                } text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors`}
                autoComplete="username"
              />
            </div>
            {errors.pin && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.pin.message}
              </p>
            )}
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
                {...register("password")}
                placeholder="Enter your password"
                className={`w-full h-12 pl-10 pr-11 rounded-xl border ${
                  errors.password ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-slate-50/50"
                } text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors`}
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
            {errors.password && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.password.message}
              </p>
            )}
          </div>

          {serverError && !errors.pin && !errors.password && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Login
              </>
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
