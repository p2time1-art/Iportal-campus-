import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import { GraduationCap, FileText, CheckCircle2, Clock, ArrowRight, Users, Calendar, Info, UserPlus } from "lucide-react";

const requirements = [
  "Completed online application form",
  "Birth certificate or age declaration",
  "Recent passport-sized photograph",
  "Last academic report / transfer certificate",
  "Medical / immunization record",
  "Guardian's valid identification"
];

const instructions = [
  { step: 1, title: "Create an Application", desc: "Fill out the online application form with accurate personal and academic details." },
  { step: 2, title: "Upload Documents", desc: "Upload all required documents in PDF, JPG, or PNG format." },
  { step: 3, title: "Pay Application Fee", desc: "If your school requires an application fee, complete the secure online payment." },
  { step: 4, title: "Submit Application", desc: "Review your application and submit. You will receive a unique application number." },
  { step: 5, title: "Check Status", desc: "Use your application number to check your admission status regularly." },
  { step: 6, title: "Accept Admission", desc: "If accepted, follow the instructions to sign up and complete your enrollment." }
];

export default function Admission() {
  const [acceptedApps, setAcceptedApps] = useState([]);
  const [loadingAccepted, setLoadingAccepted] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getAcceptedApplicants", {});
        const data = res.data || res;
        setAcceptedApps(data.applicants || []);
      } catch (_e) {
        // non-fatal
      } finally {
        setLoadingAccepted(false);
      }
    })();
  }, []);

  return (
    <PublicPageLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a0b4d] to-[#1e3a8a] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-4xl mb-3">Admission</h1>
          <p className="text-white/70 text-lg max-w-2xl">Everything you need to know about applying for admission — requirements, instructions, and status checking.</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link to="/applications/new" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#f97316] hover:bg-[#f97316]/90 text-white font-semibold text-sm transition-all">
              Start New Application <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/applications/status" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all">
              Check Application Status
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Admission Information */}
        <section id="info">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-[#f97316]" /> Admission Information
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-slate-600 leading-relaxed mb-4">
              iPortal Campus welcomes applications from students seeking quality secondary education. Our admission process is designed to be transparent, fair, and straightforward. Applications are reviewed on a rolling basis, and applicants are notified of their status via the online portal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <Calendar className="w-5 h-5 text-[#f97316] mb-2" />
                <p className="text-sm font-semibold text-[#0f172a]">Application Period</p>
                <p className="text-xs text-slate-500">Applications are accepted throughout the academic year.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <Clock className="w-5 h-5 text-[#f97316] mb-2" />
                <p className="text-sm font-semibold text-[#0f172a]">Review Timeline</p>
                <p className="text-xs text-slate-500">Applications are reviewed within 5–10 business days.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <Users className="w-5 h-5 text-[#f97316] mb-2" />
                <p className="text-sm font-semibold text-[#0f172a]">Notification</p>
                <p className="text-xs text-slate-500">Applicants are notified via the online portal and email.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section id="requirements">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#f97316]" /> Admission Requirements
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <ul className="space-y-3">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Instructions */}
        <section id="instructions">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#f97316]" /> Admission Instructions
          </h2>
          <div className="space-y-4">
            {instructions.map((inst) => (
              <div key={inst.step} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white font-heading font-bold text-lg flex items-center justify-center shrink-0">
                  {inst.step}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0f172a] mb-1">{inst.title}</h3>
                  <p className="text-sm text-slate-500">{inst.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accepted Applicants — privacy-safe (application number + programme only) */}
        <section id="accepted">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#f97316]" /> Accepted Applicants
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-4">
              Accepted applicants are listed by application number. If your application number appears below, congratulations! Please sign up to complete your enrollment.
            </p>
            {loadingAccepted ? (
              <div className="text-center py-8 text-slate-400">Loading accepted applicants…</div>
            ) : acceptedApps.length > 0 ? (
              <div className="space-y-2">
                {acceptedApps.map((a, i) => (
                  <div key={i} className="flex items-center justify-between bg-emerald-50 rounded-lg px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#0f172a]">{a.application_number}</p>
                      <p className="text-xs text-slate-500">{a.programme || "—"}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                No accepted applicants have been announced yet. Please check back later or check your application status using your application number.
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link to="/admission/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-[#f97316] hover:underline">
                <UserPlus className="w-4 h-4" /> Admitted? Sign up here
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#0a0b4d] to-[#1e3a8a] rounded-2xl p-8 text-center text-white">
          <h2 className="font-heading font-extrabold text-2xl mb-2">Ready to Apply?</h2>
          <p className="text-white/70 mb-6">Start your application today and take the first step toward quality education.</p>
          <Link to="/applications/new" className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#f97316] hover:bg-[#f97316]/90 text-white font-semibold text-sm transition-all">
            Start New Application <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}