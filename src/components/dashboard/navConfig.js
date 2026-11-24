import {
  LayoutDashboard, User, GraduationCap, Users, BookOpen, ClipboardList,
  CalendarDays, CreditCard, ReceiptText, Megaphone,
  Settings, ShieldCheck, FileBarChart, ScrollText, Wallet,
  BookUser, NotebookPen, Building2, UserCog, Calendar,
  CalendarCheck, UsersRound, Award, KeyRound, Globe, BarChart3, Sliders
} from "lucide-react";

export const navConfig = {
  super_admin: {
    label: "Super Admin",
    color: "hsl(263 70% 50%)",
    groups: [
      {
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
          { label: "My Account", icon: User, path: "/app/my-account" }
        ]
      },
      {
        label: "Platform",
        items: [
          { label: "Schools", icon: Building2, path: "/app/schools" },
          { label: "Administrators", icon: UserCog, path: "/app/administrators" },
          { label: "Users", icon: Users, path: "/app/users" },
          { label: "Roles & Permissions", icon: ShieldCheck, path: "/app/roles" },
          { label: "Feature Flags", icon: Sliders, path: "/app/features" }
        ]
      },
      {
        label: "Billing",
        items: [
          { label: "Subscriptions", icon: CreditCard, path: "/app/subscriptions" },
          { label: "Transactions", icon: Wallet, path: "/app/platform-transactions" }
        ]
      },
      {
        label: "Reports",
        items: [
          { label: "Platform Reports", icon: FileBarChart, path: "/app/platform-reports" }
        ]
      },
      {
        label: "System",
        items: [
          { label: "Platform Settings", icon: Settings, path: "/app/platform-settings" },
          { label: "System Logs", icon: ScrollText, path: "/app/system-logs" }
        ]
      }
    ]
  },
  school_admin: {
    label: "School Admin",
    color: "hsl(243 75% 59%)",
    groups: [
      {
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
          { label: "My Account", icon: User, path: "/app/my-account" }
        ]
      },
      {
        label: "Academics",
        items: [
          { label: "Students", icon: GraduationCap, path: "/app/students" },
          { label: "Teachers", icon: Users, path: "/app/teachers" },
          { label: "Parents", icon: UsersRound, path: "/app/parents", featureKey: "parents" },
          { label: "Classes", icon: BookOpen, path: "/app/classes" },
          { label: "Subjects", icon: BookUser, path: "/app/subjects" },
          { label: "Timetable", icon: Calendar, path: "/app/timetable" },
          { label: "Sessions", icon: CalendarDays, path: "/app/sessions" },
          { label: "Terms", icon: Calendar, path: "/app/terms" },
          { label: "Admissions", icon: GraduationCap, path: "/app/admissions" }
        ]
      },
      {
        label: "Academic Operations",
        items: [
          { label: "Results", icon: FileBarChart, path: "/app/results" },
          { label: "Grading", icon: Award, path: "/app/grading" },
          { label: "Assignments", icon: ClipboardList, path: "/app/assignments" },
          { label: "Attendance", icon: CalendarCheck, path: "/app/attendance" },
          { label: "Report Cards", icon: ScrollText, path: "/app/report-card" }
        ]
      },
      {
        label: "Finance",
        items: [
          { label: "Fee Categories", icon: CreditCard, path: "/app/fee-categories" },
          { label: "Fee Structures", icon: ClipboardList, path: "/app/fee-structures" },
          { label: "Student Billing", icon: Wallet, path: "/app/billing" },
          { label: "Payments", icon: ReceiptText, path: "/app/payments" },
          { label: "Online Payments", icon: Globe, path: "/app/online-payments" }
        ]
      },
      {
        label: "Reports",
        items: [
          { label: "School Analytics", icon: BarChart3, path: "/app/analytics" }
        ]
      },
      {
        label: "Communication",
        items: [
          { label: "Announcements", icon: Megaphone, path: "/app/announcements" }
        ]
      },
      {
        label: "System",
        items: [
          { label: "User Accounts", icon: KeyRound, path: "/app/user-accounts" },
          { label: "School Settings", icon: Settings, path: "/app/settings" },
          { label: "Audit Logs", icon: ScrollText, path: "/app/audit-logs" }
        ]
      }
    ]
  },
  bursar: {
    label: "Bursar / Accountant",
    color: "hsl(160 84% 39%)",
    groups: [
      {
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
          { label: "My Account", icon: User, path: "/app/my-account" }
        ]
      },
      {
        label: "Finance & Billing",
        items: [
          { label: "Fee Categories", icon: CreditCard, path: "/app/fee-categories" },
          { label: "Fee Structures", icon: ClipboardList, path: "/app/fee-structures" },
          { label: "Student Billing", icon: Wallet, path: "/app/billing" },
          { label: "Payments & Receipts", icon: ReceiptText, path: "/app/payments" },
          { label: "Online Payments", icon: Globe, path: "/app/online-payments" }
        ]
      },
      {
        label: "Directory & Reports",
        items: [
          { label: "Student Directory", icon: GraduationCap, path: "/app/students" },
          { label: "Financial Analytics", icon: BarChart3, path: "/app/analytics" },
          { label: "Announcements", icon: Megaphone, path: "/app/announcements" }
        ]
      }
    ]
  },
  exam_officer: {
    label: "Exam Officer / Principal",
    color: "hsl(217 91% 60%)",
    groups: [
      {
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
          { label: "My Account", icon: User, path: "/app/my-account" }
        ]
      },
      {
        label: "Examinations & Grading",
        items: [
          { label: "Review & Publish Results", icon: FileBarChart, path: "/app/results" },
          { label: "Grade Entry Sheet", icon: ClipboardList, path: "/app/result-entry" },
          { label: "Grading Schemes", icon: Award, path: "/app/grading" },
          { label: "Principal & Class Remarks", icon: NotebookPen, path: "/app/remarks" },
          { label: "Sign & Issue Report Cards", icon: ScrollText, path: "/app/report-card" }
        ]
      },
      {
        label: "Academic Structure",
        items: [
          { label: "Students", icon: GraduationCap, path: "/app/students" },
          { label: "Teachers", icon: Users, path: "/app/teachers" },
          { label: "Classes", icon: BookOpen, path: "/app/classes" },
          { label: "Subjects", icon: BookUser, path: "/app/subjects" },
          { label: "Timetable", icon: Calendar, path: "/app/timetable" },
          { label: "Sessions", icon: CalendarDays, path: "/app/sessions" },
          { label: "Terms", icon: Calendar, path: "/app/terms" },
          { label: "Attendance", icon: CalendarCheck, path: "/app/attendance" },
          { label: "Announcements", icon: Megaphone, path: "/app/announcements" }
        ]
      }
    ]
  },
  teacher: {
    label: "Teacher",
    color: "hsl(25 95% 53%)",
    groups: [
      {
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
          { label: "My Account", icon: User, path: "/app/my-account" }
        ]
      },
      {
        label: "Academic",
        items: [
          { label: "My Classes", icon: BookOpen, path: "/app/teacher/classes" },
          { label: "Timetable", icon: Calendar, path: "/app/timetable" },
          { label: "Results", icon: FileBarChart, path: "/app/results" },
          { label: "Assignments", icon: ClipboardList, path: "/app/assignments" },
          { label: "Attendance", icon: CalendarCheck, path: "/app/attendance" },
          { label: "Remarks", icon: NotebookPen, path: "/app/remarks" },
          { label: "My Analytics", icon: BarChart3, path: "/app/teacher/analytics" }
        ]
      },
      {
        label: "Communication",
        items: [
          { label: "Announcements", icon: Megaphone, path: "/app/announcements" }
        ]
      }
    ]
  },
  student: {
    label: "Student",
    color: "hsl(142 71% 45%)",
    groups: [
      {
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/app" },
          { label: "My Account", icon: User, path: "/app/my-account" }
        ]
      },
      {
        label: "Academic",
        items: [
          { label: "Results", icon: FileBarChart, path: "/app/results" },
          { label: "Timetable", icon: Calendar, path: "/app/timetable" },
          { label: "Report Card", icon: ScrollText, path: "/app/report-card" },
          { label: "Assignments", icon: ClipboardList, path: "/app/assignments" },
          { label: "Attendance", icon: CalendarCheck, path: "/app/attendance" },
          { label: "My Analytics", icon: BarChart3, path: "/app/my-analytics" }
        ]
      },
      {
        label: "Finance",
        items: [
          { label: "My Finance", icon: Wallet, path: "/app/finance" },
          { label: "Pay Fees", icon: CreditCard, path: "/app/pay-fees" },
          { label: "Receipt", icon: ReceiptText, path: "/app/receipts" }
        ]
      },
      {
        label: "Communication",
        items: [
          { label: "Announcements", icon: Megaphone, path: "/app/announcements" }
        ]
      }
    ]
  },
  parent: {
    label: "Parent / Guardian",
    color: "hsl(200 80% 50%)",
    groups: [
      {
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/app", featureKey: "parents" },
          { label: "My Account", icon: User, path: "/app/my-account" }
        ]
      },
      {
        label: "Academic",
        items: [
          { label: "Results", icon: FileBarChart, path: "/app/results", featureKey: "parents" },
          { label: "Timetable", icon: Calendar, path: "/app/timetable", featureKey: "parents" },
          { label: "Report Card", icon: ScrollText, path: "/app/report-card", featureKey: "parents" },
          { label: "Assignments", icon: ClipboardList, path: "/app/assignments", featureKey: "parents" },
          { label: "Attendance", icon: CalendarCheck, path: "/app/attendance", featureKey: "parents" },
          { label: "Analytics", icon: BarChart3, path: "/app/my-analytics", featureKey: "parents" }
        ]
      },
      {
        label: "Finance",
        items: [
          { label: "My Finance", icon: Wallet, path: "/app/finance", featureKey: "parents" },
          { label: "Pay Fees", icon: CreditCard, path: "/app/pay-fees", featureKey: "parents" },
          { label: "Receipt", icon: ReceiptText, path: "/app/receipts", featureKey: "parents" }
        ]
      },
      {
        label: "Communication",
        items: [
          { label: "Announcements", icon: Megaphone, path: "/app/announcements", featureKey: "parents" }
        ]
      }
    ]
  }
};