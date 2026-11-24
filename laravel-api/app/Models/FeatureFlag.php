<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $table = 'feature_flags';

    protected $fillable = [
        'school_id',
        'feature_key',
        'is_enabled',
        'updated_by_user_id',
    ];

    protected $casts = [
        'school_id' => 'integer',
        'is_enabled' => 'boolean',
        'updated_by_user_id' => 'integer',
    ];
}
