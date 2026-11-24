<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends IportalModel
{
    protected $table = 'roles';

    protected $casts = [
        'is_platform_role' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(SchoolMembership::class, 'role', 'slug');
    }
}
