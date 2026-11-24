<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdmissionApplication extends IportalModel
{
    protected $table = 'admission_applications';

    protected $casts = [
        'application_data' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function admissionDocuments(): HasMany
    {
        return $this->hasMany(AdmissionDocument::class);
    }

    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'admission_documents', 'admission_application_id', 'document_id')
            ->withPivot('verification_status');
    }
}
