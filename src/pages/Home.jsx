import React from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import LoginCard from "@/components/public/LoginCard";
import NewsSection from "@/components/public/NewsSection";
import { BookOpen, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero — light split layout with school background image */}
      <section className="relative pt-16 lg:pt-[68px] overflow-hidden bg-slate-50/60">
        {/* Hero image — visible on the right, fading naturally into white on the left */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 lg:opacity-100"
            style={{
              backgroundImage:
                "url('https://media.base44.com/images/public/6a8f5b3097375e1ebc98213e/be3f683e2_file_00000000efa8821089f29701e28dfd44.png')",
              WebkitMaskImage:
                "linear-gradient(100deg, transparent 0%, transparent 16%, rgba(0,0,0,0.95) 42%, #000 100%)",
              maskImage:
                "linear-gradient(100deg, transparent 0%, transparent 16%, rgba(0,0,0,0.95) 42%, #000 100%)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          />
          {/* Light wash for cohesion + left-side legibility (fades to transparent on the right) */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/35 to-transparent" />
          {/* Bottom fade into the news section */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — messaging */}
            <div>
              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.1] tracking-tight mb-4">
                <span className="text-[#1a2336]">Welcome to</span>{" "}
                <span className="text-[#e67e22]">iPortal Campus</span>
              </h1>
              <p className="text-lg font-semibold text-[#1a2336] mb-3">
                Secondary School Management Portal
              </p>
              <p className="text-base text-slate-500 leading-relaxed max-w-lg mb-8">
                A smarter way to manage academics, payments, communication and everyday school operations — all in one connected platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-semibold text-sm transition-all shadow-lg shadow-[#0f172a]/20"
                >
                  <BookOpen className="w-4 h-4" /> Explore Portal
                </Link>
                <Link
                  to="/information"
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl border-2 border-[#0f172a] text-[#0f172a] hover:bg-[#0f172a] hover:text-white font-semibold text-sm transition-all"
                >
                  <Clock className="w-4 h-4" /> Learn More
                </Link>
              </div>

            </div>

            {/* Right — login card */}
            <div className="lg:pl-8">
              <LoginCard />
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <NewsSection />

      <Footer />
    </div>
  );
}