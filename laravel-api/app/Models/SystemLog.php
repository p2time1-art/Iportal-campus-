<?php

namespace App\Models;

class SystemLog extends IportalModel
{
    public const UPDATED_AT = null;

    protected $table = 'system_logs';

    protected $casts = [
        'context' => 'array',
    ];
}
