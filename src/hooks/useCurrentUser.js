import { useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";

const ROLE_ALIASES = {
  SAD: "super_admin",
  ADM: "school_admin",
  BUR: "bursar",
  EXM: "exam_officer",
  TEA: "teacher",
  STU: "student",
  PAR: "parent",
  super_admin: "super_admin",
  school_admin: "school_admin",
  bursar: "bursar",
  accountant: "bursar",
  exam_officer: "exam_officer",
  principal: "exam_officer",
  teacher: "teacher",
  student: "student",
  parent: "parent",
};

const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: ["*"],
  school_admin: ["*"],
  bursar: [
    "finance.view",
    "finance.manage_fees",
    "finance.assign_charges",
    "finance.record_payment",
    "finance.reverse_payment",
    "finance.issue_receipts",
    "finance.manage_gateways",
    "students.view",
    "announcements.view",
  ],
  exam_officer: [
    "academics.view",
    "academics.manage",
    "results.view",
    "results.enter",
    "results.edit",
    "results.approve",
    "results.publish",
    "grading.manage",
    "remarks.principal",
    "report_cards.generate",
    "report_cards.sign",
    "students.view",
    "teachers.view",
    "attendance.view",
    "timetable.manage",
    "announcements.manage",
  ],
  teacher: [
    "academics.view",
    "results.view",
    "results.enter",
    "results.edit",
    "attendance.manage",
    "assignments.manage",
    "remarks.teacher",
    "announcements.view",
  ],
  student: [
    "results.view_own",
    "report_cards.view_own",
    "finance.view_own",
    "finance.pay_online",
    "assignments.submit",
    "timetable.view",
    "announcements.view",
  ],
  parent: [
    "results.view_children",
    "report_cards.view_children",
    "finance.view_children",
    "finance.pay_online",
    "timetable.view",
    "announcements.view",
  ],
};

const FORBIDDEN_ROLE_PERMISSIONS = {
  bursar: [
    "results.enter",
    "results.edit",
    "results.approve",
    "results.publish",
    "grading.manage",
    "remarks.principal",
    "report_cards.sign",
  ],
  exam_officer: [
    "finance.manage_fees",
    "finance.assign_charges",
    "finance.record_payment",
    "finance.reverse_payment",
    "finance.manage_gateways",
  ],
};

/**
 * Adapts Laravel's current-user response to the fields used by portal screens,
 * including granular sub-admin roles (Bursar / Accountant, Exam Officer / Principal)
 * and a `can(permission)` authorization helper.
 */
export function useCurrentUser() {
  const { user: profile, isLoadingAuth: loading, authError: error } = useAuth();

  return useMemo(() => {
    const roleCode = profile?.role_slug || profile?.role || profile?.membership?.role;
    const role = ROLE_ALIASES[roleCode] || "user";

    const rawPerms =
      profile?.permissions ||
      profile?.membership?.permissions ||
      DEFAULT_ROLE_PERMISSIONS[role] ||
      [];
    const forbidden = FORBIDDEN_ROLE_PERMISSIONS[role] || [];
    const permissions = rawPerms.includes("*")
      ? ["*"]
      : rawPerms.filter((p) => !forbidden.includes(p));

    const can = (permission) => {
      if (forbidden.includes(permission)) return false;
      if (permissions.includes("*")) return true;
      return permissions.includes(permission);
    };

    const membership = profile?.membership
      ? {
          ...profile.membership,
          user_name: profile.full_name,
          school_name: profile.school?.name,
          permissions,
        }
      : null;

    const user = profile
      ? {
          ...profile,
          permissions,
          data: {
            pin: profile.pin,
            must_change_password: profile.must_change_password,
            active_role: profile.role,
            active_school_id: profile.active_school_id,
          },
        }
      : null;

    return {
      user,
      membership,
      school: profile?.school || null,
      role,
      permissions,
      can,
      isFinanceStaff: role === "school_admin" || role === "super_admin" || role === "bursar",
      isAcademicAdmin: role === "school_admin" || role === "super_admin" || role === "exam_officer",
      schoolId: profile?.active_school_id || "",
      loading,
      error,
    };
  }, [profile, loading, error]);
}
