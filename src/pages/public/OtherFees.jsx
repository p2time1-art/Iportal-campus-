import React from "react";
import { Link } from "react-router-dom";
import PublicPageLayout from "@/components/public/PublicPageLayout";
import { Receipt, CreditCard, FileText, ArrowRight, Info } from "lucide-react";

const feeTypes = [
  { name: "Transcript Request", description: "Official academic transcript processing and issuance.", icon: FileText },
  { name: "Student ID Card", description: "New ID card issuance or replacement for lost/damaged cards.", icon: CreditCard },
  { name: "Hostel Accommodation", description: "Boarding house accommodation fees per term or session.", icon: Receipt },
  { name: "Late Registration", description: "Penalty fee for course/subject registration after the deadline.", icon: FileText },
  { name: "Result Verification", description: "External verification of academic results by third parties.", icon: FileText },
  { name: "Transfer Clearance", description: "Processing fee for student transfer clearance documents.", icon: Receipt }
];

export default function OtherFees() {
  return (
    <PublicPageLayout>
      <div className="bg-gradient-to-br from-[#0a0b4d] to-[#1e3a8a] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-4xl mb-3">Other Fees</h1>
          <p className="text-white/70 text-lg max-w-2xl">Additional school charges and administrative fees beyond standard tuition. Schools configure these fees — contact your school for current rates.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {feeTypes.map((fee, i) => {
            const Icon = fee.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-[#0f172a] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0f172a] mb-2">{fee.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{fee.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-heading font-bold text-base text-[#0f172a] mb-1">How to Pay Other Fees</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Other fees are configured by each school and integrated with the school's payment system. To view your specific charges and make payments online, please log in to your portal account. All payment amounts are calculated and validated server-side.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#0a0b4d] to-[#1e3a8a] rounded-2xl p-8 text-center text-white">
          <h2 className="font-heading font-extrabold text-xl mb-2">Pay Your Fees Online</h2>
          <p className="text-white/70 mb-6">Log in to view your fee breakdown and make secure online payments.</p>
          <Link to="/account/fees" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#f97316] hover:bg-[#f97316]/90 text-white font-semibold text-sm transition-all">
            Login to Pay Fees <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </PublicPageLayout>
  );
}