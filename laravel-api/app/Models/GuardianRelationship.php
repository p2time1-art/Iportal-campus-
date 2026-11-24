<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardianRelationship extends IportalModel
{
    protected $table = 'guardian_relationships';

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(ParentGuardian::class, 'guardian_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
