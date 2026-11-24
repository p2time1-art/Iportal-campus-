<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeStructure extends IportalModel
{
    protected $table = 'fee_structures';

    protected $casts = [
        'amount' => 'decimal:2',
        'auto_apply' => 'boolean',
        'is_mandatory' => 'boolean',
        'is_acceptance_fee' => 'boolean',
        'due_date' => 'date:Y-m-d',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FeeCategory::class, 'fee_category_id');
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class, 'term_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function studentCharges(): HasMany
    {
        return $this->hasMany(StudentCharge::class);
    }
}
