<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicSession extends IportalModel
{
    protected $table = 'academic_sessions';

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function terms(): HasMany
    {
        return $this->hasMany(Term::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    public function studentClassMemberships(): HasMany
    {
        return $this->hasMany(StudentClassMembership::class);
    }
}
