import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[#0a0b4d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} iPortal Campus. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/55">Powered by</span>
            <span className="font-heading font-extrabold text-sm tracking-tight text-[#f97316]">
              APrime
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}