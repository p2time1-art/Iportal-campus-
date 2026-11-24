<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends IportalModel
{
    protected $table = 'user_sessions';

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    protected $hidden = [
        'token_hash',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
