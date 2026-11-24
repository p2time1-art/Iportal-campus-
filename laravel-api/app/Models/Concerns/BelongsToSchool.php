<?php

namespace App\Models\Concerns;

use App\Models\Scopes\SchoolScope;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Model;

trait BelongsToSchool
{
    public static function bootBelongsToSchool(): void
    {
        static::addGlobalScope(new SchoolScope());

        static::creating(function (Model $model) {
            $tenantId = TenantContext::id();
            if ($tenantId !== null && empty($model->school_id)) {
                $model->school_id = $tenantId;
            }
        });
    }
}
