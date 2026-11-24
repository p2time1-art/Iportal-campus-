<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ParentGuardian extends IportalModel
{
    use SoftDeletes;

    protected $table = 'parent_guardians';

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function relationships(): HasMany
    {
        return $this->hasMany(GuardianRelationship::class, 'guardian_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'guardian_relationships', 'guardian_id', 'student_id')
            ->withPivot(['school_id', 'relationship_type', 'is_primary']);
    }
}
