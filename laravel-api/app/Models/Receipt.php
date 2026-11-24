<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends IportalModel
{
    protected $table = 'receipts';

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
