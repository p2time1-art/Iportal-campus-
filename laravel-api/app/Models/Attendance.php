<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends IportalModel
{
    protected $table = 'attendance';

    protected $casts = [
        'attendance_date' => 'date',
    ];

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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
