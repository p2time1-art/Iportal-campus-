import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, GraduationCap } from "lucide-react";

const navItems = [
  { label: "Home", path: "/" },
  {
    label: "Applications",
    path: "/applications/new",
    children: [
      { label: "New Application", path: "/applications/new" },
      { label: "Application Status", path: "/applications/status" },
      { label: "Required Documents", path: "/applications/documents" }
    ]
  },
  {
    label: "Admission",
    path: "/admission",
    children: [
      { label: "Admission Information", path: "/admission" },
      { label: "Admission Status", path: "/applications/status" },
      { label: "Accepted Applicants", path: "/admission#accepted" },
      { label: "Requirements", path: "/admission#requirements" },
      { label: "Admission Instructions", path: "/admission#instructions" }
    ]
  },
  {
    label: "Account",
    path: "/account/results",
    children: [
      { label: "Check Result", path: "/account/results" },
      { label: "Pay Fees", path: "/account/fees" },
      { label: "Download Receipt", path: "/account/receipts" }
    ]
  },
  { label: "Other Fees", path: "/other-fees" },
  {
    label: "Information",
    path: "/information",
    children: [
      { label: "School Information", path: "/information" },
      { label: "Announcements", path: "/information#announcements" },
      { label: "Academic Calendar", path: "/information#calendar" },
      { label: "Policies", path: "/information#policies" },
      { label: "FAQs", path: "/information#faq" }
    ]
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    children: [
      { label: "Vacancies", path: "/recruitment" },
      { label: "Requirements", path: "/recruitment#requirements" },
      { label: "Apply", path: "/recruitment#apply" },
      { label: "Application Status", path: "/recruitment#status" }
    ]
  }
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-xl shadow-[0_2px_20px_-8px_rgba(10,11,77,0.15)]" : "bg-white"
      } border-b border-slate-100`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#0a0b4d] flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="block font-heading font-extrabold text-[15px] text-[#0a0b4d] tracking-tight">
                iPortal<span className="text-[#f97316]"> Campus</span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                Modern · Smart · Secure
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    to={item.path || "#"}
                    className="flex items-center gap-1 px-3 py-2 text-[13px] font-semibold text-slate-600 hover:text-[#0a0b4d] transition-colors uppercase tracking-wide"
                  >
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                  </Link>
                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-1 w-56">
                      <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.path}
                            className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0a0b4d] transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                    isActive(item.path)
                      ? "text-[#f97316]"
                      : "text-slate-600 hover:text-[#0a0b4d]"
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-[#0a0b4d]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 shadow-lg max-h-[80vh] overflow-y-auto scrollbar-thin">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="py-1">
                  {item.path ? (
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-[#0a0b4d]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {item.label}
                    </p>
                  )}
                  <div className="pl-3 border-l-2 border-slate-100 ml-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.path}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    isActive(item.path) ? "text-[#f97316]" : "text-slate-600 hover:text-[#0a0b4d]"
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}