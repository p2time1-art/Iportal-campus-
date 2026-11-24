<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timetable extends IportalModel
{
    protected $table = 'timetables';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class, 'term_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(TimetableEntry::class, 'timetable_id');
    }
}
