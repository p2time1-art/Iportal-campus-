<?php

namespace App\Models;

use App\Models\Scopes\SchoolScope;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

abstract class IportalModel extends Model
{
    use HasFactory;

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $guarded = ['id'];

    protected static function booted(): void
    {
        static::addGlobalScope(new SchoolScope());

        static::creating(function (Model $model) {
            if (! SchoolScope::isTenantTable($model->getTable())) {
                return;
            }

            $tenantId = TenantContext::id();
            if ($tenantId !== null && $tenantId > 0) {
                // Enforce tenant school_id on creation
                if (empty($model->school_id)) {
                    $model->school_id = $tenantId;
                }
            }
        });
    }
}
