<?php

namespace App\Models;

class NotificationDispatch extends IportalModel
{
    protected $table = 'notification_dispatches';

    protected $casts = [
        'metadata' => 'array',
        'dispatched_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
