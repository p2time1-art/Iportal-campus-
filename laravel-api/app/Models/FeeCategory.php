<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeCategory extends IportalModel
{
    protected $table = 'fee_categories';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function feeStructures(): HasMany
    {
        return $this->hasMany(FeeStructure::class);
    }
}
