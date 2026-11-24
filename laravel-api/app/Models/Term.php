<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Term extends IportalModel
{
    protected $table = 'terms';

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function remarks(): HasMany
    {
        return $this->hasMany(TermRemark::class);
    }
}
