<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new \LogicException('Role and permission seeding is restricted to the local environment.');
        }

        $roleDefinitions = [
            'SAD' => ['Super Admin', true],
            'ADM' => ['School Admin', false],
            'TEA' => ['Teacher', false],
            'STU' => ['Student', false],
            'PAR' => ['Parent/Guardian', false],
        ];

        $roles = [];

        foreach ($roleDefinitions as $slug => [$name, $isPlatformRole]) {
            $roles[$slug] = Role::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'is_platform_role' => $isPlatformRole]
            );
        }

        $permissionDefinitions = [
            'platform.schools.manage' => ['Manage schools', 'Platform'],
            'platform.users.manage' => ['Manage platform users', 'Platform'],
            'platform.subscriptions.manage' => ['Manage subscriptions', 'Platform'],
            'platform.transactions.view' => ['View platform transactions', 'Platform'],
            'platform.gateways.manage' => ['Manage payment gateways', 'Platform'],
            'platform.audit.view' => ['View platform audit logs', 'Platform'],
            'school.dashboard.view' => ['View school dashboard', 'School'],
            'school.memberships.manage' => ['Manage school memberships', 'School'],
            'students.view' => ['View students', 'Academic'],
            'students.manage' => ['Manage students', 'Academic'],
            'teachers.view' => ['View teachers', 'Academic'],
            'teachers.manage' => ['Manage teachers', 'Academic'],
            'guardians.view' => ['View parents and guardians', 'Academic'],
            'guardians.manage' => ['Manage parents and guardians', 'Academic'],
            'academics.sessions.manage' => ['Manage academic sessions and terms', 'Academic'],
            'academics.classes.manage' => ['Manage classes', 'Academic'],
            'academics.subjects.manage' => ['Manage subjects', 'Academic'],
            'academics.assignments.manage' => ['Manage assigned-class assignments', 'Academic'],
            'academics.attendance.manage' => ['Manage assigned-class attendance', 'Academic'],
            'academics.attendance.view' => ['View own or linked attendance', 'Academic'],
            'academics.results.manage' => ['Manage assigned-class results', 'Academic'],
            'academics.results.view' => ['View own or linked results', 'Academic'],
            'fees.manage' => ['Manage fee structures and charges', 'Finance'],
            'fees.view' => ['View own or linked fees', 'Finance'],
            'payments.view' => ['View authorized payments', 'Finance'],
            'payments.record' => ['Record school payments', 'Finance'],
            'announcements.manage' => ['Manage school announcements', 'Communication'],
            'notifications.view' => ['View own notifications', 'Communication'],
            'student.records.view' => ['View own student records', 'Student'],
            'student.assignments.view' => ['View own assignments', 'Student'],
            'parent.children.view' => ['View linked child records', 'Parent'],
            'parent.children.finance.view' => ['View linked child fees and payments', 'Parent'],
            'reports.school.view' => ['View school reports', 'Reporting'],
            'audit.school.view' => ['View school audit logs', 'Audit'],
        ];

        $permissions = [];

        foreach ($permissionDefinitions as $slug => [$name, $group]) {
            $permissions[$slug] = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'group_name' => $group]
            );
        }

        $all = array_keys($permissions);
        $schoolAdmin = [
            'school.dashboard.view', 'school.memberships.manage',
            'students.view', 'students.manage', 'teachers.view', 'teachers.manage',
            'guardians.view', 'guardians.manage', 'academics.sessions.manage',
            'academics.classes.manage', 'academics.subjects.manage',
            'academics.assignments.manage', 'academics.attendance.manage',
            'academics.results.manage', 'fees.manage', 'payments.view',
            'payments.record', 'announcements.manage', 'notifications.view',
            'reports.school.view', 'audit.school.view',
        ];
        $teacher = [
            'school.dashboard.view', 'students.view', 'academics.assignments.manage',
            'academics.attendance.manage', 'academics.results.manage',
            'academics.results.view', 'notifications.view',
        ];
        $student = [
            'school.dashboard.view', 'academics.attendance.view',
            'academics.results.view', 'fees.view', 'payments.view',
            'notifications.view', 'student.records.view', 'student.assignments.view',
        ];
        $parent = [
            'school.dashboard.view', 'academics.attendance.view',
            'academics.results.view', 'fees.view', 'payments.view',
            'notifications.view', 'parent.children.view',
            'parent.children.finance.view',
        ];

        $assignments = [
            'SAD' => $all,
            'ADM' => $schoolAdmin,
            'TEA' => $teacher,
            'STU' => $student,
            'PAR' => $parent,
        ];

        foreach ($assignments as $roleCode => $permissionSlugs) {
            $roles[$roleCode]->permissions()->sync(
                array_map(fn (string $slug): int => $permissions[$slug]->id, $permissionSlugs)
            );
        }
    }
}
