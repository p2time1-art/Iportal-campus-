<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends IportalModel
{
    protected $table = 'payments';

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function onlineTransactions(): HasMany
    {
        return $this->hasMany(OnlinePaymentTransaction::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }
}
