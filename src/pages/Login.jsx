import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";
import LoginCard from "@/components/public/LoginCard";

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/" className="inline-flex items-center gap-2.5 text-[#0a0b4d] hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-[#0a0b4d] flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-extrabold text-[15px] tracking-tight">
            iPortal<span className="text-[#f97316]"> Campus</span>
          </span>
        </Link>
      </div>

      {/* Centered login */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0a0b4d] transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>
            <h1 className="font-heading font-extrabold text-3xl text-[#0a0b4d] mb-2">Welcome Back</h1>
            <p className="text-slate-500">Sign in to access your portal dashboard</p>
          </div>
          <LoginCard compact />
        </div>
      </div>
    </div>
  );
}