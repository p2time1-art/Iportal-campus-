<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends IportalModel
{
    use SoftDeletes;

    protected $table = 'subjects';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(Teacher::class, 'teacher_assignments', 'subject_id', 'teacher_id')
            ->withPivot(['school_id', 'class_id', 'academic_session_id']);
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }
}
