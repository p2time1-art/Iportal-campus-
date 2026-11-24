<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TermRemark extends IportalModel
{
    protected $table = 'term_remarks';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
