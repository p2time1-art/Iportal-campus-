<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Document extends IportalModel
{
    protected $table = 'documents';

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function owner(): MorphTo
    {
        return $this->morphTo('owner', 'owner_model', 'owner_id');
    }

    public function admissionApplications(): BelongsToMany
    {
        return $this->belongsToMany(AdmissionApplication::class, 'admission_documents', 'document_id', 'admission_application_id')
            ->withPivot('verification_status');
    }
}
