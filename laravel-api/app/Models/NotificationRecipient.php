<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationRecipient extends IportalModel
{
    public const UPDATED_AT = null;

    protected $table = 'notification_recipients';

    protected $casts = [
        'read_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
