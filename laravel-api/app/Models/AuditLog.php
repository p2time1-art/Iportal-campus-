<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends IportalModel
{
    public const UPDATED_AT = null;

    protected $table = 'audit_logs';

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
