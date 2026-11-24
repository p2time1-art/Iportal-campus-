import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import { FileText, Loader2, Upload, CheckCircle2, AlertCircle, User, Mail, GraduationCap, X, CreditCard, Eye, Image as ImageIcon, Lock } from "lucide-react";

const inputCls = "w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-[#0f172a] placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0f172a] focus:bg-white transition-colors";
const labelCls = "text-[13px] font-semibold text-[#0f172a] mb-1.5 block";

function sanitizePhone(v) { return (v || "").replace(/\D/g, "").slice(0, 15); }
function isValidPhone(v) { const d = sanitizePhone(v); return d.length >= 7 && d.length <= 15; }
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim().toLowerCase()); }

export default function NewApplication() {
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    school_id: "", programme: "", class_id: "",
    first_name: "", surname: "", other_names: "",
    email: "", phone: "",
    date_of_birth: "", gender: "", address: "",
    previous_school: "", previous_qualification: "",
    guardian_name: "", guardian_phone: "", guardian_email: "", notes: ""
  });
  const [passport, setPassport] = useState(null);
  const [birthCert, setBirthCert] = useState(null);
  const [otherDocs, setOtherDocs] = useState([]);
  const [uploadingField, setUploadingField] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("getPublicAdmissionContext", {});
        const data = res.data || res;
        const loadedSchools = data.schools || [];
        setSchools(loadedSchools);
        setClasses(data.classes || []);
        // Fix School * to the active registered tenant school
        if (loadedSchools.length > 0) {
          setForm((prev) => ({ ...prev, school_id: loadedSchools[0].id }));
        }
      } catch (_e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedSchool = schools.find((s) => String(s.id) === String(form.school_id)) || schools[0] || null;
  const feeEnabled = selectedSchool ? selectedSchool.application_fee_enabled !== false : true;
  const feeAmount = Number(selectedSchool?.application_fee_amount ?? 5000);
  const availableClasses = classes.filter((c) => String(c.school_id) === String(selectedSchool?.id || form.school_id));

  const uploadSingle = async (file, setter, fieldName) => {
    setUploadingField(fieldName);
    setError("");
    try {
      const purpose = fieldName === "passport" ? "passport" : "document";
      const { file_url } = await base44.integrations.Core.UploadFile({ file, purpose });
      setter({ file_name: file.name, url: file_url });
    } catch (_e) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploadingField("");
    }
  };

  const uploadMultiple = async (files) => {
    setUploadingField("others");
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file, purpose: "document" });
        uploaded.push({ name: file.name.replace(/\.[^.]+$/, ""), file_name: file.name, url: file_url });
      }
      setOtherDocs((prev) => [...prev, ...uploaded]);
    } catch (_e) {
      setError("Document upload failed. Please try again.");
    } finally {
      setUploadingField("");
    }
  };

  const validateForm = () => {
    setError("");
    if (!selectedSchool?.id && !form.school_id) return "No registered school tenant is available.";
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.surname.trim()) return "Surname is required.";
    if (!isValidEmail(form.email)) return "Please enter a valid email address.";
    if (form.phone && !isValidPhone(form.phone)) return "Phone number must be 11 digits.";
    if (form.guardian_phone && !isValidPhone(form.guardian_phone)) return "Guardian phone must be 11 digits.";
    return "";
  };

  const handleReview = () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    setShowReview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("submitAdmissionApplication", {
        ...form,
        school_id: selectedSchool?.id || form.school_id,
        passport,
        birth_certificate: birthCert,
        other_documents: otherDocs
      });
      const data = res.data || res;

      if (data.requires_payment) {
        setPaying(true);
        try {
          const payRes = await base44.functions.invoke("payApplicationFee", {
            application_id: data.application_id,
            callback_url: `${window.location.origin}/applications/status?ref=PLACEHOLDER`
          });
          const payData = payRes.data || payRes;
          if (payData.authorization_url) {
            window.location.href = payData.authorization_url;
            return;
          }
        } catch (payErr) {
          setError(payErr?.response?.data?.error || payErr?.data?.error || payErr?.message || "Payment initialization failed.");
          setPaying(false);
        } finally {
          setSubmitting(false);
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicPageLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </PublicPageLayout>
    );
  }

  if (result) {
    return (
      <PublicPageLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-2">Application Submitted!</h1>
            <p className="text-slate-500 mb-6">{result.message}</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Your Application Number</p>
              <p className="font-mono text-xl font-bold text-[#0f172a] tracking-wider">{result.application_number}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/applications/status" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all">
                Check Application Status
              </Link>
              <Link to="/" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-slate-200 text-[#0f172a] hover:bg-slate-50 font-semibold text-sm transition-all">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0f172a] mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-[#1a2336] mb-2">New Application</h1>
          <p className="text-slate-500">Complete the form below to apply for admission. Fields marked with * are required.</p>
        </div>

        {showReview ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg text-[#0f172a]">Review Your Application</h2>
                <button onClick={() => setShowReview(false)} className="text-sm font-semibold text-[#f97316] hover:underline">Edit</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs font-semibold text-slate-400">School</p><p className="font-semibold text-[#0f172a]">{selectedSchool?.name || "—"}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Programme/Class</p><p className="text-[#0f172a]">{form.programme || "—"}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Name</p><p className="text-[#0f172a]">{[form.first_name, form.surname, form.other_names].filter(Boolean).join(" ")}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Email</p><p className="text-[#0f172a]">{form.email}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Phone</p><p className="text-[#0f172a]">{form.phone || "—"}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Date of Birth</p><p className="text-[#0f172a]">{form.date_of_birth || "—"}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Gender</p><p className="text-[#0f172a] capitalize">{form.gender || "—"}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Address</p><p className="text-[#0f172a]">{form.address || "—"}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Previous School</p><p className="text-[#0f172a]">{form.previous_school || "—"}</p></div>
                <div><p className="text-xs font-semibold text-slate-400">Guardian</p><p className="text-[#0f172a]">{form.guardian_name || "—"}</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 mb-2">Documents</p>
                <div className="space-y-1 text-sm">
                  <p className="text-[#0f172a]">Passport: {passport ? "✓ Uploaded" : "Not uploaded"}</p>
                  <p className="text-[#0f172a]">Birth Certificate: {birthCert ? "✓ Uploaded" : "Not uploaded"}</p>
                  <p className="text-[#0f172a]">Other Documents: {otherDocs.length > 0 ? `${otherDocs.length} file(s)` : "None"}</p>
                </div>
              </div>

              {feeEnabled && feeAmount > 0 && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-heading font-bold text-amber-900">Application Fee: ₦{feeAmount.toLocaleString()}</p>
                    <p className="text-xs text-amber-700 mt-0.5">Payable online to complete and submit your admission application.</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-amber-800" />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowReview(false)} className="h-12 px-6 rounded-xl border border-slate-200 text-[#0f172a] hover:bg-slate-50 font-semibold text-sm transition-all">
                Edit Application
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || paying}
                className="flex-1 h-12 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting || paying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {paying ? "Processing payment…" : "Submitting…"}</>
                ) : feeEnabled && feeAmount > 0 ? (
                  <><CreditCard className="w-4 h-4" /> Pay Application Fee (₦{feeAmount.toLocaleString()}) & Submit</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Submit Application</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Programme Selection */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-heading font-bold text-lg text-[#0f172a] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#f97316]" /> Programme Selection
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>School *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedSchool?.name || "Registered School"}
                      readOnly
                      disabled
                      className="w-full h-11 pl-3 pr-9 rounded-lg border border-slate-200 bg-slate-100 text-[#0f172a] font-semibold text-sm cursor-not-allowed"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  </div>
                  {/* {feeEnabled && feeAmount > 0 && (
                    <p className="text-xs text-amber-700 mt-1.5 font-semibold">Application fee: ₦{feeAmount.toLocaleString()}</p>
                  )} */}
                </div>
                <div>
                  <label className={labelCls}>Programme / Class</label>
                  <select
                    className={inputCls}
                    value={form.programme}
                    onChange={(e) => {
                      const cls = availableClasses.find((c) => c.name === e.target.value);
                      setForm({ ...form, programme: e.target.value, class_id: cls?.id || "" });
                    }}
                  >
                    <option value="">Select a programme / class</option>
                    {availableClasses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Personal Details */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-heading font-bold text-lg text-[#0f172a] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#f97316]" /> Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input className={inputCls} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                </div>
                <div>
                  <label className={labelCls}>Surname *</label>
                  <input className={inputCls} value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} required />
                </div>
                <div>
                  <label className={labelCls}>Other Names</label>
                  <input className={inputCls} value={form.other_names} onChange={(e) => setForm({ ...form, other_names: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Date of Birth</label>
                  <input type="date" className={inputCls} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-heading font-bold text-lg text-[#0f172a] mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#f97316]" /> Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div>
                  <label className={labelCls}>Phone (digits only)</label>
                  <input
                    type="tel"
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })}
                    placeholder="e.g. 08012345678"
                    maxLength={15}
                  />
                  {form.phone && !isValidPhone(form.phone) && form.phone.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">Phone must be 11 digits.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Academic Background */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-heading font-bold text-lg text-[#0f172a] mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#f97316]" /> Academic Background
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Previous School</label>
                  <input className={inputCls} value={form.previous_school} onChange={(e) => setForm({ ...form, previous_school: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Previous Class Average</label>
                  <input className={inputCls} value={form.previous_class_average} onChange={(e) => setForm({ ...form, previous_class_average: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Guardian Information */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-heading font-bold text-lg text-[#0f172a] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[#f97316]" /> Guardian Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Guardian Name</label>
                  <input className={inputCls} value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Guardian Phone (digits only)</label>
                  <input
                    type="tel"
                    className={inputCls}
                    value={form.guardian_phone}
                    onChange={(e) => setForm({ ...form, guardian_phone: sanitizePhone(e.target.value) })}
                    maxLength={15}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Guardian Email</label>
                  <input type="email" className={inputCls} value={form.guardian_email} onChange={(e) => setForm({ ...form, guardian_email: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Document Upload — Dedicated Fields */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-heading font-bold text-lg text-[#0f172a] mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#f97316]" /> Required Documents
              </h2>

              {/* Passport */}
              <div className="mb-5">
                <label className={labelCls}>Passport Photograph</label>
                {passport ? (
                  <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                    <span className="text-sm text-[#0f172a] truncate flex items-center gap-2"><ImageIcon className="w-4 h-4 text-slate-400" /> {passport.file_name}</span>
                    <button type="button" onClick={() => setPassport(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-11 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-[#0f172a] text-sm text-slate-500">
                    {uploadingField === "passport" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload passport photograph</>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSingle(f, setPassport, "passport"); }} disabled={uploadingField !== ""} />
                  </label>
                )}
              </div>

              {/* Birth Certificate */}
              <div className="mb-5">
                <label className={labelCls}>Birth Certificate</label>
                {birthCert ? (
                  <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                    <span className="text-sm text-[#0f172a] truncate flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {birthCert.file_name}</span>
                    <button type="button" onClick={() => setBirthCert(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-11 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-[#0f172a] text-sm text-slate-500">
                    {uploadingField === "birthcert" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload birth certificate</>}
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSingle(f, setBirthCert, "birthcert"); }} disabled={uploadingField !== ""} />
                  </label>
                )}
              </div>

              {/* Other Documents */}
              <div>
                <label className={labelCls}>Other Documents (results, transfer certificate, medical record, etc.)</label>
                {otherDocs.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {otherDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-[#0f172a] truncate flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> {doc.file_name}</span>
                        <button type="button" onClick={() => setOtherDocs((prev) => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center h-11 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-[#0f172a] text-sm text-slate-500">
                  {uploadingField === "others" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload additional documents</>}
                  <input type="file" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) uploadMultiple(files); }} disabled={uploadingField !== ""} />
                </label>
              </div>
            </section>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={handleReview}
              className="w-full h-12 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" /> Review Application
            </button>
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
