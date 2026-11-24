<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentGatewayConfig extends IportalModel
{
    protected $table = 'payment_gateway_configs';

    protected $hidden = [
        'secret_key_ciphertext',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
