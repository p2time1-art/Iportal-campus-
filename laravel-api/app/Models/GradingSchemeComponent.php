<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradingSchemeComponent extends IportalModel
{
    protected $table = 'grading_scheme_components';

    protected $casts = [
        'minimum_score' => 'decimal:2',
        'maximum_score' => 'decimal:2',
    ];

    public function gradingScheme(): BelongsTo
    {
        return $this->belongsTo(GradingScheme::class);
    }
}
