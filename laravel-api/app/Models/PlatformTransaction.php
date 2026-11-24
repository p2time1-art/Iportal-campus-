<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformTransaction extends IportalModel
{
    protected $table = 'platform_transactions';

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
