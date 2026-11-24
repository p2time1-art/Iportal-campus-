import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import { Briefcase, Search, Loader2, AlertCircle, Upload, CheckCircle2, X, FileText, MapPin, Clock } from "lucide-react";

const inputCls = "w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors";
const labelCls = "text-[13px] font-semibold text-[#0f172a] mb-1.5 block";
const employmentLabels = { full_time: "Full-Time", part_time: "Part-Time", contract: "Contract", internship: "Internship" };

export default function Recruitment() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", cover_letter: "", qualifications: "", experience: "" });
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appResult, setAppResult] = useState(null);
  const [appError, setAppError] = useState("");

  // Status check state
  const [statusNumber, setStatusNumber] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const items = await base44.entities.JobVacancy.filter({ status: "open" }, "-posted_at", 50);
        setVacancies(items || []);
      } catch (_e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setResume({ url: file_url, name: file.name });
    } catch (_e) {
      setAppError("Resume upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setAppError("");
    if (!form.full_name || !form.email || !selectedVacancy) {
      setAppError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitJobApplication", {
        vacancy_id: selectedVacancy.id,
        ...form,
        resume_url: resume?.url || "",
        resume_name: resume?.name || ""
      });
      setAppResult(res.data || res);
    } catch (err) {
      setAppError(err?.response?.data?.error || err?.data?.error || err?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusCheck = async (e) => {
    e.preventDefault();
    setStatusError("");
    setStatusResult(null);
    if (!statusNumber.trim()) {
      setStatusError("Please enter your application number.");
      return;
    }
    setStatusLoading(true);
    try {
      const res = await base44.functions.invoke("checkJobApplicationStatus", { application_number: statusNumber.trim() });
      setStatusResult(res.data || res);
    } catch (err) {
      setStatusError(err?.response?.data?.error || err?.data?.error || err?.message || "Unable to find application.");
    } finally {
      setStatusLoading(false);
    }
  };

  const resetApplyForm = () => {
    setShowApplyForm(false);
    setSelectedVacancy(null);
    setForm({ full_name: "", email: "", phone: "", cover_letter: "", qualifications: "", experience: "" });
    setResume(null);
    setAppResult(null);
    setAppError("");
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <PublicPageLayout>
      <div className="bg-gradient-to-br from-[#0a0b4d] to-[#1e3a8a] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-4xl mb-3">Recruitment</h1>
          <p className="text-white/70 text-lg max-w-2xl">Browse open vacancies and apply online. Track your application status using your application number.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Vacancies */}
        <section id="vacancies">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-6">Open Vacancies</h2>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : vacancies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {vacancies.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0f172a] flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Open</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#0f172a] mb-2">{v.title}</h3>
                  {v.school_name && <p className="text-xs text-slate-400 mb-3">{v.school_name}</p>}
                  <p className="text-sm text-slate-500 line-clamp-3 mb-4">{v.description || "No description provided."}</p>
                  <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
                    {v.department && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {v.department}</span>}
                    {v.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.location}</span>}
                    {v.employment_type && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {employmentLabels[v.employment_type] || v.employment_type}</span>}
                    {v.closing_date && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Closes {formatDate(v.closing_date)}</span>}
                  </div>
                  <button
                    onClick={() => { setSelectedVacancy(v); setShowApplyForm(true); setAppResult(null); setAppError(""); }}
                    className="w-full h-10 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No open vacancies at this time. Please check back later.</p>
            </div>
          )}
        </section>

        {/* Requirements / How to Apply */}
        <section id="requirements">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-6">Application Requirements</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Completed online application form",
                "Current resume / CV (PDF format preferred)",
                "Cover letter explaining your interest and suitability",
                "Relevant qualifications and certifications",
                "Professional references (if requested)",
                "Valid identification document"
              ].map((req, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Status Check */}
        <section id="status">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-6">Check Application Status</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-4">Enter your application number to check the status of your recruitment application.</p>
            <form onSubmit={handleStatusCheck} className="flex gap-3 mb-4">
              <input
                type="text"
                value={statusNumber}
                onChange={(e) => setStatusNumber(e.target.value)}
                placeholder="e.g., JOB-XXXXX-XXXXXX"
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors font-mono"
              />
              <button type="submit" disabled={statusLoading} className="h-12 px-6 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 flex items-center gap-2 shrink-0">
                {statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Check
              </button>
            </form>
            {statusError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> {statusError}
              </div>
            )}
            {statusResult && (
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Application Number</p>
                    <p className="font-mono text-sm font-bold text-[#0f172a]">{statusResult.application_number}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full capitalize">{(statusResult.status || "").replace(/_/g, " ")}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-600"><span className="font-semibold text-[#0f172a]">Position:</span> {statusResult.vacancy_title}</p>
                  <p className="text-slate-600"><span className="font-semibold text-[#0f172a]">Applicant:</span> {statusResult.full_name}</p>
                  <p className="text-slate-600"><span className="font-semibold text-[#0f172a]">Submitted:</span> {formatDate(statusResult.submitted_at)}</p>
                  {statusResult.notes && <p className="text-slate-600"><span className="font-semibold text-[#0f172a]">Notes:</span> {statusResult.notes}</p>}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Apply Modal */}
      {showApplyForm && selectedVacancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={resetApplyForm}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            {appResult ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-2">Application Submitted!</h2>
                <p className="text-slate-500 mb-6">{appResult.message}</p>
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Your Application Number</p>
                  <p className="font-mono text-xl font-bold text-[#0f172a] tracking-wider">{appResult.application_number}</p>
                </div>
                <button onClick={resetApplyForm} className="h-11 px-6 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                  <div>
                    <h2 className="font-heading font-extrabold text-xl text-[#1a2336]">Apply for: {selectedVacancy.title}</h2>
                    <p className="text-sm text-slate-500">{selectedVacancy.school_name}</p>
                  </div>
                  <button onClick={resetApplyForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleApply} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input className={inputCls} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                    </div>
                    <div>
                      <label className={labelCls}>Email *</label>
                      <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Resume / CV</label>
                      {resume ? (
                        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                          <span className="text-sm text-[#0f172a] truncate flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {resume.name}</span>
                          <button type="button" onClick={() => setResume(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center h-11 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-[#0f172a] text-sm text-slate-500">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload resume</>}
                          <input type="file" className="hidden" onChange={handleResumeUpload} disabled={uploading} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Qualifications</label>
                    <textarea className={`${inputCls} h-20 py-2`} value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Experience</label>
                    <textarea className={`${inputCls} h-20 py-2`} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Cover Letter</label>
                    <textarea className={`${inputCls} h-24 py-2`} value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} />
                  </div>
                  {appError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {appError}
                    </div>
                  )}
                  <button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><CheckCircle2 className="w-4 h-4" /> Submit Application</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </PublicPageLayout>
  );
}