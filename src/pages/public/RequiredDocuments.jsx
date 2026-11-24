import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import { Search, Loader2, AlertCircle, FileText, Upload } from "lucide-react";

const requiredDocuments = [
  { name: "Birth Certificate", description: "A copy of the applicant's birth certificate" },
  { name: "Passport Photograph", description: "Recent passport-sized photograph" },
  { name: "Previous Result", description: "Most recent academic result or transcript" },
  { name: "Transfer Certificate", description: "Transfer certificate from previous school (if applicable)" },
  { name: "Medical Record", description: "Recent medical/health record" },
  { name: "Guardian ID", description: "Copy of guardian's valid identification" }
];

export default function RequiredDocuments() {
  const [appNumber, setAppNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!appNumber.trim()) {
      setError("Please enter your application number.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("checkApplicationStatus", { application_number: appNumber.trim() });
      setResult(res.data || res);
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Unable to find application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicPageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0f172a] mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-[#1a2336] mb-2">Required Documents</h1>
          <p className="text-slate-500">Enter your application number to check which documents have been received and which are still outstanding.</p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={appNumber}
              onChange={(e) => setAppNumber(e.target.value)}
              placeholder="e.g., APP-XXXXX-XXXXXX"
              className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors font-mono"
            />
            <button type="submit" disabled={loading} className="h-12 px-6 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Check
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mt-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </form>

        {result && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Application Number</p>
                <p className="font-mono text-lg font-bold text-[#0f172a]">{result.application_number}</p>
              </div>
              <span className="text-sm font-semibold text-slate-500 capitalize">{(result.status || "").replace(/_/g, " ")}</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Document verification status is determined by the school's admissions office after review. If your application is under review, your documents are being processed.
            </p>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#f97316]" />
              <Link to="/applications/new" className="text-sm font-semibold text-[#f97316] hover:underline">Submit a new application →</Link>
            </div>
          </div>
        )}

        {!result && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-heading font-bold text-lg text-[#0f172a] mb-4">General Document Requirements</h2>
            <div className="space-y-3">
              {requiredDocuments.map((req, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{req.name}</p>
                    <p className="text-xs text-slate-500">{req.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}