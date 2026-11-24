<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobVacancy extends IportalModel
{
    protected $table = 'job_vacancies';

    protected $casts = [
        'closing_date' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
