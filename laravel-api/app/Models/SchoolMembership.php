<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolMembership extends IportalModel
{
    use SoftDeletes;

    protected $table = 'school_memberships';

    protected $casts = [
        'is_primary' => 'boolean',
        'permissions' => 'array',
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

    public function roleDefinition(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role', 'slug');
    }
}
