<?php

namespace App\Models\Scopes;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class SchoolScope implements Scope
{
    public const TENANT_TABLES = [
        'students',
        'teachers',
        'parent_guardians',
        'guardian_relationships',
        'academic_sessions',
        'terms',
        'school_classes',
        'subjects',
        'teacher_assignments',
        'student_class_memberships',
        'grading_schemes',
        'results',
        'attendance',
        'assignments',
        'assignment_submissions',
        'term_remarks',
        'fee_categories',
        'fee_structures',
        'student_charges',
        'payments',
        'payment_allocations',
        'receipts',
        'online_payment_transactions',
        'payment_gateway_configs',
        'announcements',
        'admission_applications',
        'timetables',
        'notification_dispatches',
    ];

    public static function isTenantTable(string $table): bool
    {
        return in_array($table, self::TENANT_TABLES, true);
    }

    /**
     * Automatically appends WHERE <table>.school_id = ? for all tenant-owned models.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (TenantContext::shouldBypass()) {
            return;
        }

        $table = $model->getTable();
        if (! self::isTenantTable($table)) {
            return;
        }

        $schoolId = TenantContext::id();
        if ($schoolId !== null && $schoolId > 0) {
            $builder->where($table . '.school_id', $schoolId);
        }
    }
}
