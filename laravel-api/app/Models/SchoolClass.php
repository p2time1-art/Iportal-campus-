<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends IportalModel
{
    use SoftDeletes;

    protected $table = 'school_classes';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function studentMemberships(): HasMany
    {
        return $this->hasMany(StudentClassMembership::class, 'class_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_class_memberships', 'class_id', 'student_id')
            ->withPivot(['school_id', 'academic_session_id']);
    }

    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class, 'class_id');
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(Teacher::class, 'teacher_assignments', 'class_id', 'teacher_id')
            ->withPivot(['school_id', 'subject_id', 'academic_session_id']);
    }

    public function classTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'class_teacher_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'class_id');
    }
}
