<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableEntry extends IportalModel
{
    protected $table = 'timetable_entries';

    public function timetable(): BelongsTo
    {
        return $this->belongsTo(Timetable::class, 'timetable_id');
    }

    public function teacherAssignment(): BelongsTo
    {
        return $this->belongsTo(TeacherAssignment::class, 'teacher_assignment_id');
    }
}
