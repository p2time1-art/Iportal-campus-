<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notification extends IportalModel
{
    protected $table = 'notifications';

    protected $casts = [
        'read_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(NotificationRecipient::class);
    }

    public function recipientUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'notification_recipients', 'notification_id', 'user_id')
            ->withPivot(['read_at', 'delivered_at']);
    }
}
