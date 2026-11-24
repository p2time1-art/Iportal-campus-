<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends IportalModel
{
    use SoftDeletes;

    protected $table = 'schools';

    protected $casts = [
        'status' => 'string',
        'subscription_status' => 'string',
        'application_fee_enabled' => 'boolean',
        'application_fee_amount' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'active_school_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(SchoolMembership::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'school_memberships', 'school_id', 'user_id')
            ->withPivot(['role', 'status', 'is_primary']);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    public function parentGuardians(): HasMany
    {
        return $this->hasMany(ParentGuardian::class);
    }

    public function academicSessions(): HasMany
    {
        return $this->hasMany(AcademicSession::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }
}
