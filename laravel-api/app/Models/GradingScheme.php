<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GradingScheme extends IportalModel
{
    use SoftDeletes;

    protected $table = 'grading_schemes';

    protected $casts = [
        'metadata' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function components(): HasMany
    {
        return $this->hasMany(GradingSchemeComponent::class);
    }
}
