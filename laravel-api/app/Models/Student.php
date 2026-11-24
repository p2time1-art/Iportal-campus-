<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends IportalModel
{
    use SoftDeletes;

    protected $table = 'students';

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    protected $with = [
        'currentClass',
    ];

    protected $appends = [
        'current_class_id',
        'current_class_name',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guardianRelationships(): HasMany
    {
        return $this->hasMany(GuardianRelationship::class);
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(ParentGuardian::class, 'guardian_relationships', 'student_id', 'guardian_id')
            ->withPivot(['school_id', 'relationship_type', 'is_primary']);
    }

    public function classMemberships(): HasMany
    {
        return $this->hasMany(StudentClassMembership::class);
    }

    public function currentClass()
    {
        return $this->hasOneThrough(
            SchoolClass::class,
            StudentClassMembership::class,
            'student_id',
            'id',
            'id',
            'class_id'
        );
    }

    public function getCurrentClassIdAttribute(): ?int
    {
        if (array_key_exists('current_class_id', $this->attributes)) {
            return $this->attributes['current_class_id'] ? (int) $this->attributes['current_class_id'] : null;
        }
        if ($this->relationLoaded('currentClass') && $this->currentClass) {
            return (int) $this->currentClass->id;
        }
        if ($this->relationLoaded('classMemberships')) {
            $membership = $this->classMemberships->sortByDesc('id')->first();
            return $membership?->class_id ? (int) $membership->class_id : null;
        }
        return null;
    }

    public function getCurrentClassNameAttribute(): string
    {
        if ($this->relationLoaded('currentClass') && $this->currentClass) {
            return (string) $this->currentClass->name;
        }
        if ($this->relationLoaded('classMemberships')) {
            $membership = $this->classMemberships->sortByDesc('id')->first();
            return $membership?->schoolClass?->name ?? '';
        }
        return '';
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'student_class_memberships', 'student_id', 'class_id')
            ->withPivot(['school_id', 'academic_session_id']);
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function charges(): HasMany
    {
        return $this->hasMany(StudentCharge::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
