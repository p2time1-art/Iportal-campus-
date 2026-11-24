<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAllocation extends IportalModel
{
    public const UPDATED_AT = null;

    protected $table = 'payment_allocations';

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function studentCharge(): BelongsTo
    {
        return $this->belongsTo(StudentCharge::class);
    }
}
