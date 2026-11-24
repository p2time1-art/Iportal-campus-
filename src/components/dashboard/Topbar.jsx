import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  X,
  GraduationCap,
  Users,
  ReceiptText,
  Building2,
  ArrowRight,
  Loader2,
  Compass,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/lib/AuthContext";
import { navConfig } from "./navConfig";
import NotificationCenter from "@/components/communication/NotificationCenter";

const ROLE_TITLES = {
  super_admin: "Super Admin Dashboard",
  school_admin: "School Administration",
  bursar: "Bursar / Finance Portal",
  exam_officer: "Examinations Portal",
  teacher: "Teacher Portal",
  student: "Student Portal",
  parent: "Parent / Guardian Portal",
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  bursar: "Bursar / Accountant",
  exam_officer: "Exam Officer",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent / Guardian",
};

const PATH_FEATURE_MAP = {
  "/app/parents": "parents",
  "/app/admissions": "admissions_portal",
  "/app/timetable": "timetable",
  "/app/assignments": "assignments",
  "/app/report-card": "pdf_documents",
  "/app/online-payments": "online_payments",
  "/app/pay-fees": "online_payments",
  "/app/analytics": "analytics",
  "/app/teacher/analytics": "analytics",
  "/app/my-analytics": "analytics",
};

export default function Topbar({ onMenuClick }) {
  const { user, membership, schoolId, role } = useCurrentUser();
  const isSuperAdmin = role === "super_admin";
  const { isFeatureEnabled } = useFeatureFlags(isSuperAdmin ? null : schoolId);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Global Search state
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [remoteResults, setRemoteResults] = useState({
    students: [],
    teachers: [],
    receipts: [],
    schools: [],
    users: [],
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const teachersCacheRef = useRef({ schoolId: null, list: [] });
  const schoolsCacheRef = useRef(null);

  const title = ROLE_TITLES[role] || "Dashboard";
  const roleLabel = ROLE_LABELS[role] || "Portal User";
  const displayName = membership?.user_name || user?.full_name || "User";
  const subtitle = user?.login_pin || user?.platform_pin || user?.email || "";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  // Build role-permitted dashboard pages list for instant navigation
  const availablePages = useMemo(() => {
    const config = navConfig[role] || navConfig.student;
    const pages = [];
    (config.groups || []).forEach((group) => {
      (group.items || []).forEach((item) => {
        if (!isSuperAdmin) {
          const itemKey = item.featureKey;
          const pathKey = PATH_FEATURE_MAP[item.path];
          if (itemKey && !isFeatureEnabled(itemKey)) return;
          if (pathKey && !isFeatureEnabled(pathKey)) return;
        }
        pages.push({
          id: `page:${item.path}`,
          type: "page",
          title: item.label,
          subtitle: group.label || "Navigation",
          path: item.path,
          icon: item.icon || Compass,
        });
      });
    });
    return pages;
  }, [role, isSuperAdmin, isFeatureEnabled]);

  const matchingPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availablePages.slice(0, 6);
    return availablePages
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.path.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query, availablePages]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setMobileSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 20);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close profile menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!searchOpen && !mobileSearchOpen) return;
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen, mobileSearchOpen]);

  // Debounced live record search across Students, Teachers, Receipts, Schools, Users
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRemoteResults({ students: [], teachers: [], receipts: [], schools: [], users: [] });
      setSearching(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const qLower = trimmed.toLowerCase();
      try {
        if (isSuperAdmin) {
          const [schoolsList, usersRes] = await Promise.all([
            schoolsCacheRef.current
              ? Promise.resolve(schoolsCacheRef.current)
              : base44.entities.School.list("-created_date", 200)
                  .then((list) => {
                    schoolsCacheRef.current = list || [];
                    return schoolsCacheRef.current;
                  })
                  .catch(() => []),
            base44.entities.SchoolMembership.paginate({ search: trimmed, per_page: 5 }, "-created_date").catch(
              () => ({ data: [] })
            ),
          ]);

          if (cancelled) return;
          const matchedSchools = (schoolsList || [])
            .filter(
              (s) =>
                (s.name || "").toLowerCase().includes(qLower) ||
                (s.code || "").toLowerCase().includes(qLower) ||
                (s.short_name || "").toLowerCase().includes(qLower)
            )
            .slice(0, 5)
            .map((s) => ({
              id: `school:${s.id}`,
              type: "school",
              title: s.name,
              subtitle: [s.code || s.short_name, s.status].filter(Boolean).join(" · "),
              path: `/app/schools/${s.id}`,
              icon: Building2,
            }));

          const matchedUsers = (usersRes?.data || []).slice(0, 5).map((u) => ({
            id: `user:${u.id}`,
            type: "user",
            title: u.user_name || u.user_email || "User",
            subtitle: [u.login_pin || u.user_pin, u.role_label || u.role, u.school_name].filter(Boolean).join(" · "),
            path: "/app/users",
            icon: Users,
          }));

          setRemoteResults({
            students: [],
            teachers: [],
            receipts: [],
            schools: matchedSchools,
            users: matchedUsers,
          });
        } else if (
          schoolId &&
          ["school_admin", "bursar", "exam_officer", "teacher"].includes(role)
        ) {
          const canSearchFinance = role === "school_admin" || role === "bursar";
          const canSearchTeachers = role === "school_admin" || role === "exam_officer";

          const [studentsRes, teachersList, paymentsRes] = await Promise.all([
            base44.entities.Student.paginate(
              { school_id: schoolId, search: trimmed, per_page: 5 },
              "full_name"
            ).catch(() => ({ data: [] })),
            canSearchTeachers
              ? teachersCacheRef.current.schoolId === schoolId
                ? Promise.resolve(teachersCacheRef.current.list)
                : base44.entities.Teacher.filter({ school_id: schoolId }, "full_name", 200)
                    .then((list) => {
                      teachersCacheRef.current = { schoolId, list: list || [] };
                      return list || [];
                    })
                    .catch(() => [])
              : Promise.resolve([]),
            canSearchFinance
              ? base44.entities.Payment.paginate(
                  { school_id: schoolId, search: trimmed, per_page: 5 },
                  "-payment_date"
                ).catch(() => ({ data: [] }))
              : Promise.resolve({ data: [] }),
          ]);

          if (cancelled) return;

          const matchedStudents = (studentsRes?.data || []).slice(0, 5).map((s) => ({
            id: `student:${s.id}`,
            type: "student",
            title: s.full_name || "Student",
            subtitle: [s.admission_number, s.current_class_name, s.login_pin].filter(Boolean).join(" · "),
            path: canSearchFinance ? `/app/billing/${s.id}` : "/app/students",
            icon: GraduationCap,
          }));

          const matchedTeachers = (teachersList || [])
            .filter(
              (t) =>
                (t.full_name || "").toLowerCase().includes(qLower) ||
                (t.staff_number || "").toLowerCase().includes(qLower) ||
                (t.email || "").toLowerCase().includes(qLower) ||
                (t.login_pin || "").toLowerCase().includes(qLower)
            )
            .slice(0, 5)
            .map((t) => ({
              id: `teacher:${t.id}`,
              type: "teacher",
              title: t.full_name || "Teacher",
              subtitle: [t.staff_number || t.login_pin, t.email].filter(Boolean).join(" · "),
              path: "/app/teachers",
              icon: Users,
            }));

          const matchedReceipts = (paymentsRes?.data || []).slice(0, 5).map((p) => ({
            id: `payment:${p.id}`,
            type: "receipt",
            title: p.receipt_number || p.payment_reference || `Payment #${p.id}`,
            subtitle: [
              p.student_name,
              p.amount ? `₦${Number(p.amount).toLocaleString("en-NG")}` : null,
              p.payment_date,
            ]
              .filter(Boolean)
              .join(" · "),
            path: "/app/payments",
            icon: ReceiptText,
          }));

          setRemoteResults({
            students: matchedStudents,
            teachers: matchedTeachers,
            receipts: matchedReceipts,
            schools: [],
            users: [],
          });
        } else {
          setRemoteResults({ students: [], teachers: [], receipts: [], schools: [], users: [] });
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, role, schoolId, isSuperAdmin]);

  // Grouped sections & flattened list for keyboard selection
  const sections = useMemo(() => {
    const groups = [];
    if (remoteResults.students.length > 0) groups.push({ label: "Students", items: remoteResults.students });
    if (remoteResults.teachers.length > 0) groups.push({ label: "Teachers", items: remoteResults.teachers });
    if (remoteResults.receipts.length > 0) groups.push({ label: "Receipts & Payments", items: remoteResults.receipts });
    if (remoteResults.schools.length > 0) groups.push({ label: "Schools", items: remoteResults.schools });
    if (remoteResults.users.length > 0) groups.push({ label: "Users", items: remoteResults.users });
    if (matchingPages.length > 0) groups.push({ label: query.trim() ? "Pages" : "Quick Navigation", items: matchingPages });
    return groups;
  }, [remoteResults, matchingPages, query]);

  const flatResults = useMemo(() => sections.flatMap((g) => g.items), [sections]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, flatResults.length]);

  const handleSelectResult = (item) => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setQuery("");
    navigate(item.path);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setMobileSearchOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatResults[activeIndex] || flatResults[0];
      if (target) handleSelectResult(target);
    }
  };

  const handleNavigate = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const searchPlaceholder = isSuperAdmin
    ? "Search schools, users, pages…"
    : ["school_admin", "bursar"].includes(role)
      ? "Search students, teachers, receipts…"
      : "Jump to page…";

  return (
    <header className="no-print sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-secondary text-foreground shrink-0"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-base sm:text-lg text-foreground leading-none truncate">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block truncate">
              Welcome back, {displayName.split(" ")[0]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Global Search (Desktop inline + Mobile toggle) */}
          <div ref={searchRef} className="relative">
            {/* Mobile search trigger */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((prev) => !prev);
                setSearchOpen(true);
                setTimeout(() => inputRef.current?.focus(), 20);
              }}
              className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop inline search input */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                aria-label="Global search"
                className="h-9 w-56 lg:w-72 pl-9 pr-14 rounded-lg bg-secondary/60 border border-border/60 text-sm placeholder:text-muted-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30 transition-all"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 p-0.5 rounded hover:bg-slate-200 text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-2.5 hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-white border border-border rounded">
                  Ctrl K
                </kbd>
              )}
            </div>

            {/* Mobile slide-down search bar + dropdown container */}
            {(searchOpen || mobileSearchOpen) && (
              <div
                className={`${
                  mobileSearchOpen ? "block" : "hidden md:block"
                } fixed md:absolute left-3 right-3 md:left-auto md:right-0 top-[68px] md:top-11 md:w-96 bg-white rounded-2xl border border-border/80 shadow-2xl overflow-hidden z-50`}
              >
                {/* Mobile-only input inside popover */}
                <div className="flex md:hidden items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-secondary/30">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={query}
                    autoFocus={mobileSearchOpen}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Results list */}
                <div className="max-h-80 overflow-y-auto py-1.5">
                  {searching && (
                    <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Searching records…
                    </div>
                  )}

                  {!searching && flatResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      No matches found for &ldquo;{query}&rdquo;.
                    </div>
                  ) : (
                    sections.map((section) => (
                      <div key={section.label} className="mb-1 last:mb-0">
                        <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {section.label}
                        </p>
                        {section.items.map((item) => {
                          const Icon = item.icon || Compass;
                          const idx = flatResults.findIndex((f) => f.id === item.id);
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseEnter={() => setActiveIndex(idx)}
                              onClick={() => handleSelectResult(item)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2 text-left transition-colors ${
                                isActive
                                  ? "bg-[hsl(var(--brand-indigo))]/10 text-foreground"
                                  : "hover:bg-secondary/60 text-foreground"
                              }`}
                            >
                              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-[hsl(var(--brand-indigo))] shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{item.title}</p>
                                {item.subtitle && (
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                <div className="hidden md:flex items-center justify-between px-3.5 py-2 bg-secondary/40 border-t border-border/60 text-[10px] text-muted-foreground">
                  <span>↑↓ Navigate · ↵ Open · Esc Close</span>
                  {query.trim().length === 1 && <span>Type 2+ chars for records</span>}
                </div>
              </div>
            )}
          </div>

          <NotificationCenter />

          {/* Clickable Profile Avatar Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open profile menu"
              className="flex items-center gap-1.5 p-1 pr-2 rounded-full hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-indigo))]/30"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-indigo))] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initials}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform hidden sm:block ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-border/80 shadow-xl py-2 z-50"
              >
                {/* User summary */}
                <div className="px-4 py-2.5 border-b border-border/60">
                  <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{subtitle}</p>
                  )}
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--brand-indigo))]/10 text-[hsl(var(--brand-indigo))]">
                    {roleLabel}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate("/app/my-account")}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/70 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      handleNavigate(
                        role === "super_admin"
                          ? "/app/platform-settings"
                          : role === "school_admin"
                            ? "/app/settings"
                            : "/app/change-password"
                      )
                    }
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/70 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Account Settings
                  </button>
                </div>

                <div className="pt-1 border-t border-border/60">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
