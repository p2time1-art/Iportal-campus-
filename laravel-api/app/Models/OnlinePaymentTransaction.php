<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnlinePaymentTransaction extends IportalModel
{
    protected $table = 'online_payment_transactions';

    protected $casts = [
        'request_payload' => 'array',
        'response_payload' => 'array',
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
