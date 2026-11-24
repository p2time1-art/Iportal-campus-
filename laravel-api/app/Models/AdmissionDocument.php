<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdmissionDocument extends IportalModel
{
    public const UPDATED_AT = null;

    protected $table = 'admission_documents';

    public function admissionApplication(): BelongsTo
    {
        return $this->belongsTo(AdmissionApplication::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
