<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentSubmission extends IportalModel
{
    protected $table = 'assignment_submissions';

    protected $casts = [
        'score' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
