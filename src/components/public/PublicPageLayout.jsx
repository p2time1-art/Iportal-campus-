import React from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function PublicPageLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 lg:pt-[68px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}