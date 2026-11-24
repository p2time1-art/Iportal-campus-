import React from "react";
import { Crown, ShieldCheck, GraduationCap, BookOpen, Users, Check, Wallet, Award, XCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const roles = [
  {
    name: "Super Admin",
    icon: Crown,
    color: "violet",
    description: "Platform-level management of all schools, users, subscriptions, and system configuration.",
    permissions: [
      "Platform management",
      "School management",
      "Platform users",
      "Administrators",
      "Subscriptions",
      "Platform transactions",
      "Reports",
      "System logs",
    ],
    restrictions: [],
  },
  {
    name: "School Admin",
    icon: ShieldCheck,
    color: "indigo",
    description: "Full administrative authority over a single tenant school — students, staff, academics, finance, and sub-roles.",
    permissions: [
      "School management",
      "Sub-role assignment",
      "Students",
      "Teachers",
      "Parents",
      "Classes & Subjects",
      "Sessions & Terms",
      "Results & Grading",
      "Finance & Payment Reversals",
      "Announcements",
    ],
    restrictions: [],
  },
  {
    name: "Bursar / Accountant (Sub-Admin)",
    icon: Wallet,
    color: "green",
    description: "Dedicated Financial Officer — manages fee structures, student billing, payments, reversals, and QR receipts.",
    permissions: [
      "Fee Categories & Structures",
      "Student Billing & Invoices",
      "Record Offline & Online Payments",
      "Reverse Financial Payments",
      "Issue Official QR Receipts",
      "Financial Debtors & Analytics",
    ],
    restrictions: [
      "Cannot enter or edit academic grades",
      "Cannot approve or publish exam results",
      "Cannot modify grading schemes or sign report cards",
    ],
  },
  {
    name: "Exam Officer / Principal (Sub-Admin)",
    icon: Award,
    color: "indigo",
    description: "Dedicated Academic & Examinations Authority — approves/publishes results, configures grading, and digitally signs report cards.",
    permissions: [
      "Approve & Publish Exam Results",
      "CA & Exam Grade Entry Moderation",
      "Configure Grading Schemes",
      "Principal Endorsement Remarks",
      "Digitally Sign & Issue Report Cards",
      "Manage Classes, Subjects & Timetables",
    ],
    restrictions: [
      "Cannot record or reverse financial payments",
      "Cannot modify school fee categories or structures",
      "Cannot waive or discount student fee bills",
    ],
  },
  {
    name: "Teacher",
    icon: GraduationCap,
    color: "orange",
    description: "Manages assigned classes and subjects — results entry, attendance, assignments, lesson notes, and class remarks.",
    permissions: [
      "Assigned classes",
      "Assigned subjects",
      "Enter draft/submitted scores",
      "Attendance",
      "Assignments & Lesson Notes",
      "Class Teacher Remarks",
    ],
    restrictions: ["Cannot reverse financial payments"],
  },
  {
    name: "Student",
    icon: BookOpen,
    color: "green",
    description: "Accesses their own academic records, timetable, assignments, report cards, and online fee payments.",
    permissions: ["Results", "Report Cards", "Timetable", "Attendance", "Assignments", "Pay Fees Online", "Official Receipts"],
    restrictions: [],
  },
  {
    name: "Parent / Guardian",
    icon: Users,
    color: "blue",
    description: "Monitors their authorized children's academic progress, timetable, attendance, and settles school fees online.",
    permissions: [
      "Children's Results",
      "Official Report Cards",
      "Class Timetable",
      "Attendance",
      "Pay Child's Fees Online",
      "Download Official QR Receipts",
    ],
    restrictions: [],
  },
];

export default function Roles() {
  return (
    <div>
      <AdminPageHeader
        title="Roles & Granular Sub-Admin Permissions"
        subtitle="Role-based access control (RBAC) with strict separation of duties between Bursar/Accountant and Exam Officer/Principal."
      />

      <div className="space-y-4">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div key={role.name} className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-[hsl(var(--brand-${role.color}))]/10 flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-6 h-6 text-[hsl(var(--brand-${role.color}))]`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-lg text-foreground">{role.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-16">
                {role.permissions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                  >
                    <Check className="w-3 h-3 text-emerald-600" /> {p}
                  </span>
                ))}
                {(role.restrictions || []).map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200/60"
                  >
                    <XCircle className="w-3 h-3 text-red-600" /> {r}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
