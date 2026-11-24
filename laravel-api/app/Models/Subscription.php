<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends IportalModel
{
    protected $table = 'subscriptions';

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
