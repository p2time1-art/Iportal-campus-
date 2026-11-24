<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends IportalModel
{
    use SoftDeletes;

    protected $table = 'teachers';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'teacher_assignments', 'teacher_id', 'class_id')
            ->withPivot(['school_id', 'subject_id', 'academic_session_id']);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'teacher_assignments', 'teacher_id', 'subject_id')
            ->withPivot(['school_id', 'class_id', 'academic_session_id']);
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
