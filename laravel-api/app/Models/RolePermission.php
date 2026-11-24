<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolePermission extends IportalModel
{
    public const UPDATED_AT = null;

    protected $table = 'role_permissions';

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class);
    }
}
