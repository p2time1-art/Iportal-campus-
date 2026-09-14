import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "./PublicPageLayout";
import LoginCard from "./LoginCard";

export default function AccountAccessPage({ title, subtitle, redirectTo, icon: Icon }) {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setAuthed);
  }, []);

  if (authed === null) {
    return (
      <PublicPageLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      </PublicPageLayout>
    );
  }

  if (authed) return <Navigate to={redirectTo} replace />;

  return (
    <PublicPageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          {Icon && (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f172a] mb-4 shadow-lg shadow-[#0f172a]/20">
              <Icon className="w-7 h-7 text-white" />
            </div>
          )}
          <h1 className="font-heading font-extrabold text-3xl text-[#1a2336] mb-2">{title}</h1>
          <p className="text-base text-slate-500">{subtitle}</p>
        </div>
        <LoginCard />
      </div>
    </PublicPageLayout>
  );
}