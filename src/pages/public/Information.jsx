import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import { Info, BellRing, Calendar, FileText, HelpCircle, ArrowRight, School } from "lucide-react";

const categoryConfig = {
  resumption: { label: "Resumption", color: "bg-[#10b981]" },
  examination: { label: "Examination", color: "bg-[#f97316]" },
  pta: { label: "PTA Meeting", color: "bg-[#8b5cf6]" },
  sports: { label: "Sports", color: "bg-[#0a0b4d]" },
  events: { label: "Events", color: "bg-[#3b82f6]" },
  general: { label: "Announcement", color: "bg-[#0a0b4d]" },
  urgent: { label: "Urgent", color: "bg-[#ef4444]" }
};

const faqs = [
  { q: "How do I apply for admission?", a: "Click on 'Applications' → 'New Application' in the navigation menu and fill out the online form. You will receive an application number to track your status." },
  { q: "How do I check my results?", a: "Log in to your portal account using your Login PIN and password, then navigate to the Results section. You can also use the 'Check Result' option under the Account menu." },
  { q: "How do I pay school fees?", a: "Log in to your portal account and go to the Finance section. Online payment options are available where enabled by your school." },
  { q: "How do I download a receipt?", a: "Log in to your portal account, go to the Finance section, and view your payment history. Receipts can be downloaded as PDF for all successful payments." },
  { q: "What if I forget my Login PIN?", a: "Contact your school administrator. They can reset your Login PIN and provide you with a new one." },
  { q: "How do I get my platform PIN?", a: "Your platform PIN is generated when your account is created. It serves as your initial password and permanent identifier. Contact your school admin if you don't have it." }
];

const policies = [
  { title: "Admission Policy", desc: "Admission is based on merit and availability. All applications are reviewed by the admissions committee." },
  { title: "Fee Payment Policy", desc: "All fees must be paid by the stated deadlines. Late payments may attract additional charges as defined by the school." },
  { title: "Attendance Policy", desc: "Students must maintain a minimum attendance rate of 80% to be eligible for examinations." },
  { title: "Code of Conduct", desc: "All students are expected to adhere to the school's code of conduct at all times." },
  { title: "Data Privacy Policy", desc: "Student data is protected and only accessible to authorized personnel. Data is never shared with third parties without consent." },
  { title: "Refund Policy", desc: "Fee refunds are subject to the school's refund policy. Contact the school administration for details." }
];

export default function Information() {
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnn, setLoadingAnn] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const items = await base44.entities.Announcement.filter(
          { is_public: true, status: "published" },
          "-date",
          10
        );
        setAnnouncements(items || []);
      } catch (_e) {
        // non-fatal
      } finally {
        setLoadingAnn(false);
      }
    })();
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <PublicPageLayout>
      <div className="bg-gradient-to-br from-[#0a0b4d] to-[#1e3a8a] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
            <Info className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-4xl mb-3">Information</h1>
          <p className="text-white/70 text-lg max-w-2xl">School information, announcements, academic calendar, policies, and frequently asked questions.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* School Information */}
        <section id="school-info">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <School className="w-6 h-6 text-[#f97316]" /> School Information
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-slate-600 leading-relaxed mb-4">
              iPortal Campus is a comprehensive digital ecosystem for secondary schools. Each school on the platform manages its own academics, finance, communication, and administration. For school-specific information, please contact your school directly or log in to your portal account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0f172a] mb-1">Academic Programs</p>
                <p className="text-xs text-slate-500">Junior and Senior Secondary programs with comprehensive curriculum.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0f172a] mb-1">Online Portal Access</p>
                <p className="text-xs text-slate-500">Students, parents, and staff can access the portal 24/7.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section id="announcements">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-[#f97316]" /> Announcements
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {loadingAnn ? (
              <div className="text-center py-8 text-slate-400">Loading announcements…</div>
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((a) => {
                  const cat = categoryConfig[a.category] || categoryConfig.general;
                  return (
                    <div key={a.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className={`w-2 h-2 rounded-full ${cat.color} mt-2 shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-400">{formatDate(a.date)}</span>
                          <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                        </div>
                        <h3 className="font-heading font-bold text-sm text-[#0f172a] mb-1">{a.title}</h3>
                        <p className="text-sm text-slate-500">{a.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">No public announcements at this time.</div>
            )}
          </div>
        </section>

        {/* Academic Calendar */}
        <section id="calendar">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#f97316]" /> Academic Calendar
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-4">The academic calendar is managed by each school. Key dates typically include:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { event: "First Term Resumption", date: "September" },
                { event: "First Term Examinations", date: "December" },
                { event: "Second Term Resumption", date: "January" },
                { event: "Second Term Examinations", date: "April" },
                { event: "Third Term Resumption", date: "May" },
                { event: "Third Term Examinations", date: "July" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-[#f97316] shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{item.event}</p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">For school-specific dates, please log in to your portal account or contact your school.</p>
          </div>
        </section>

        {/* Policies */}
        <section id="policies">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#f97316]" /> Policies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {policies.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-heading font-bold text-sm text-[#0f172a] mb-1">{p.title}</h3>
                <p className="text-sm text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section id="faq">
          <h2 className="font-heading font-extrabold text-2xl text-[#1a2336] mb-4 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#f97316]" /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-heading font-bold text-sm text-[#0f172a]">{faq.q}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-500">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}