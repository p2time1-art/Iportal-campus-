<?php

namespace App\Services;

use App\Models\GuardianRelationship;
use App\Models\ParentGuardian;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentClassMembership;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Models\User;

class AuthorizationService
{
    public function canAccessSchool(User $user, int $schoolId): bool
    {
        if (! $user->isActiveForAuthentication()) {
            return false;
        }

        if ($user->is_super_admin) {
            return true;
        }

        return $user->memberships()
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->exists();
    }

    public function canAccessStudent(User $user, Student $student): bool
    {
        if (! $user->isActiveForAuthentication()) {
            return false;
        }

        if ($user->is_super_admin) {
            return true;
        }

        $role = strtoupper((string) ($user->active_role ?? $user->activeRoleMembership()?->role ?? ''));

        if ($role === 'ADM' || $role === 'SAD') {
            return $this->canAccessSchool($user, (int) $student->school_id);
        }

        if ($role === 'STU') {
            return (int) $user->id === (int) $student->user_id;
        }

        if ($role === 'PAR') {
            $guardian = ParentGuardian::query()
                ->where('user_id', $user->id)
                ->where('school_id', $student->school_id)
                ->first();

            if (! $guardian) {
                return false;
            }

            return GuardianRelationship::query()
                ->where('guardian_id', $guardian->id)
                ->where('student_id', $student->id)
                ->where('school_id', $student->school_id)
                ->exists();
        }

        if ($role === 'TEA') {
            $teacher = Teacher::query()
                ->where('user_id', $user->id)
                ->where('school_id', $student->school_id)
                ->first();

            if (! $teacher) {
                return false;
            }

            $classIds = TeacherAssignment::query()
                ->where('teacher_id', $teacher->id)
                ->where('school_id', $student->school_id)
                ->pluck('class_id');

            return StudentClassMembership::query()
                ->where('student_id', $student->id)
                ->where('school_id', $student->school_id)
                ->whereIn('class_id', $classIds)
                ->exists();
        }

        return false;
    }

    public function canAccessTeacher(User $user, Teacher $teacher): bool
    {
        if (! $user->isActiveForAuthentication()) {
            return false;
        }

        if ($user->is_super_admin) {
            return true;
        }

        $role = strtoupper((string) ($user->active_role ?? $user->activeRoleMembership()?->role ?? ''));

        if ($role === 'ADM') {
            return $this->canAccessSchool($user, (int) $teacher->school_id);
        }

        if ($role === 'TEA') {
            return (int) $user->id === (int) $teacher->user_id;
        }

        return false;
    }

    public function canAccessParent(User $user, ParentGuardian $guardian): bool
    {
        if (! $user->isActiveForAuthentication()) {
            return false;
        }

        if ($user->is_super_admin) {
            return true;
        }

        $role = strtoupper((string) ($user->active_role ?? $user->activeRoleMembership()?->role ?? ''));

        if ($role === 'ADM') {
            return $this->canAccessSchool($user, (int) $guardian->school_id);
        }

        if ($role === 'PAR') {
            return (int) $user->id === (int) $guardian->user_id;
        }

        return false;
    }

    public function canAccessClass(User $user, SchoolClass $schoolClass): bool
    {
        if (! $user->isActiveForAuthentication()) {
            return false;
        }

        if ($user->is_super_admin) {
            return true;
        }

        $role = strtoupper((string) ($user->active_role ?? $user->activeRoleMembership()?->role ?? ''));

        if ($role === 'ADM') {
            return $this->canAccessSchool($user, (int) $schoolClass->school_id);
        }

        if ($role === 'TEA') {
            $teacher = Teacher::query()
                ->where('user_id', $user->id)
                ->where('school_id', $schoolClass->school_id)
                ->first();

            if (! $teacher) {
                return false;
            }

            return TeacherAssignment::query()
                ->where('teacher_id', $teacher->id)
                ->where('school_id', $schoolClass->school_id)
                ->where('class_id', $schoolClass->id)
                ->exists();
        }

        if ($role === 'STU') {
            $student = Student::query()->where('user_id', $user->id)->first();

            if (! $student) {
                return false;
            }

            return StudentClassMembership::query()
                ->where('student_id', $student->id)
                ->where('class_id', $schoolClass->id)
                ->exists();
        }

        return false;
    }
}
