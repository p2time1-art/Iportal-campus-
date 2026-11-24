<?php

namespace App\Services;

use App\Models\SchoolMembership;
use App\Models\User;

class RolePermissionService
{
    public const ROLE_CODE_TO_SLUG = [
        'SAD' => 'super_admin',
        'ADM' => 'school_admin',
        'BUR' => 'bursar',
        'EXM' => 'exam_officer',
        'TEA' => 'teacher',
        'STU' => 'student',
        'PAR' => 'parent',
    ];

    public const ROLE_SLUG_TO_CODE = [
        'super_admin' => 'SAD',
        'school_admin' => 'ADM',
        'bursar' => 'BUR',
        'accountant' => 'BUR',
        'exam_officer' => 'EXM',
        'principal' => 'EXM',
        'teacher' => 'TEA',
        'student' => 'STU',
        'parent' => 'PAR',
    ];

    public const ROLE_LABELS = [
        'super_admin' => 'Super Admin',
        'school_admin' => 'School Admin',
        'bursar' => 'Bursar / Accountant',
        'exam_officer' => 'Exam Officer / Principal',
        'teacher' => 'Teacher',
        'student' => 'Student',
        'parent' => 'Parent / Guardian',
    ];

    /**
     * Granular default permissions for each role.
     * - Bursar / Accountant: Finance & Billing only; CANNOT edit or publish grades.
     * - Exam Officer / Principal: Approve/publish results, manage grading, sign report cards; CANNOT record or reverse payments.
     */
    public const DEFAULT_ROLE_PERMISSIONS = [
        'super_admin' => ['*'],
        'school_admin' => ['*'],
        'bursar' => [
            'finance.view',
            'finance.manage_fees',
            'finance.assign_charges',
            'finance.record_payment',
            'finance.reverse_payment',
            'finance.issue_receipts',
            'finance.manage_gateways',
            'students.view',
            'announcements.view',
        ],
        'exam_officer' => [
            'academics.view',
            'academics.manage',
            'results.view',
            'results.enter',
            'results.edit',
            'results.approve',
            'results.publish',
            'grading.manage',
            'remarks.principal',
            'report_cards.generate',
            'report_cards.sign',
            'students.view',
            'teachers.view',
            'attendance.view',
            'timetable.manage',
            'announcements.manage',
        ],
        'teacher' => [
            'academics.view',
            'results.view',
            'results.enter',
            'results.edit',
            'attendance.manage',
            'assignments.manage',
            'remarks.teacher',
            'announcements.view',
        ],
        'student' => [
            'results.view_own',
            'report_cards.view_own',
            'finance.view_own',
            'finance.pay_online',
            'assignments.submit',
            'timetable.view',
            'announcements.view',
        ],
        'parent' => [
            'results.view_children',
            'report_cards.view_children',
            'finance.view_children',
            'finance.pay_online',
            'timetable.view',
            'announcements.view',
        ],
    ];

    /**
     * Explicitly forbidden permissions per sub-admin role (enforced even if custom flags are passed).
     */
    public const FORBIDDEN_ROLE_PERMISSIONS = [
        'bursar' => [
            'results.enter',
            'results.edit',
            'results.approve',
            'results.publish',
            'grading.manage',
            'remarks.principal',
            'report_cards.sign',
        ],
        'exam_officer' => [
            'finance.manage_fees',
            'finance.assign_charges',
            'finance.record_payment',
            'finance.reverse_payment',
            'finance.manage_gateways',
        ],
    ];

    public static function toSlug(?string $roleCodeOrSlug): string
    {
        if (! $roleCodeOrSlug) {
            return 'user';
        }
        $upper = strtoupper(trim($roleCodeOrSlug));
        if (isset(self::ROLE_CODE_TO_SLUG[$upper])) {
            return self::ROLE_CODE_TO_SLUG[$upper];
        }
        $lower = strtolower(trim($roleCodeOrSlug));
        if (isset(self::ROLE_SLUG_TO_CODE[$lower])) {
            return self::ROLE_CODE_TO_SLUG[self::ROLE_SLUG_TO_CODE[$lower]];
        }
        return $lower;
    }

    public static function toCode(?string $roleSlugOrCode): string
    {
        if (! $roleSlugOrCode) {
            return 'STU';
        }
        $upper = strtoupper(trim($roleSlugOrCode));
        if (isset(self::ROLE_CODE_TO_SLUG[$upper])) {
            return $upper;
        }
        $lower = strtolower(trim($roleSlugOrCode));
        return self::ROLE_SLUG_TO_CODE[$lower] ?? 'STU';
    }

    public static function permissionsForRole(?string $roleCodeOrSlug, ?array $customPermissions = null): array
    {
        $slug = self::toSlug($roleCodeOrSlug);
        $defaults = self::DEFAULT_ROLE_PERMISSIONS[$slug] ?? [];

        if (in_array('*', $defaults, true)) {
            return ['*'];
        }

        $merged = ! empty($customPermissions)
            ? array_values(array_unique(array_merge($defaults, $customPermissions)))
            : $defaults;

        $forbidden = self::FORBIDDEN_ROLE_PERMISSIONS[$slug] ?? [];
        if (! empty($forbidden)) {
            $merged = array_values(array_diff($merged, $forbidden));
        }

        return $merged;
    }

    public static function resolveUserRoleSlug(?User $user): string
    {
        if (! $user) {
            return 'guest';
        }
        if ($user->is_super_admin) {
            return 'super_admin';
        }
        $membership = $user->activeRoleMembership();
        $code = $membership?->role ?: $user->active_role;
        return self::toSlug($code);
    }

    public static function permissionsForUser(?User $user): array
    {
        if (! $user) {
            return [];
        }
        if ($user->is_super_admin) {
            return ['*'];
        }
        $membership = $user->activeRoleMembership();
        $code = $membership?->role ?: $user->active_role;
        return self::permissionsForRole($code, $membership?->permissions);
    }

    public static function userCan(?User $user, string $permission): bool
    {
        if (! $user) {
            return false;
        }
        $slug = self::resolveUserRoleSlug($user);

        // Enforce explicit role restrictions first
        $forbidden = self::FORBIDDEN_ROLE_PERMISSIONS[$slug] ?? [];
        if (in_array($permission, $forbidden, true)) {
            return false;
        }

        $perms = self::permissionsForUser($user);
        if (in_array('*', $perms, true)) {
            return true;
        }

        return in_array($permission, $perms, true);
    }
}
