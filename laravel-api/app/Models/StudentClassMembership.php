<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentClassMembership extends IportalModel
{
    protected $table = 'student_class_memberships';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }
}
