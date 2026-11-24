<?php

namespace App\Jobs;

use App\Http\Controllers\Api\DocumentController;
use App\Models\NotificationDispatch;
use App\Models\Student;
use App\Services\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class CompileBulkReportCardsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 300;

    public function __construct(
        public int $dispatchId,
        public int $schoolId,
        public ?int $sessionId = null,
        public ?int $termId = null,
        public ?int $classId = null,
        public string $templateStyle = 'classic'
    ) {
    }

    public function handle(): void
    {
        $dispatch = TenantContext::withoutScope(fn () => NotificationDispatch::find($this->dispatchId));
        if (! $dispatch) {
            return;
        }

        $dispatch->update([
            'status' => 'processing',
            'dispatched_at' => now(),
        ]);

        try {
            $query = TenantContext::withoutScope(fn () => Student::where('school_id', $this->schoolId)->where('status', 'active'));
            if ($this->classId) {
                $query->whereHas('classMemberships', fn ($q) => $q->where('class_id', $this->classId));
            }
            $students = $query->limit(500)->get();

            $compiledCount = 0;
            $totalBytes = 0;
            $docController = app(DocumentController::class);
            $batchFolder = 'public/report_batches/' . ($dispatch->batch_id ?: 'BATCH_' . $dispatch->id);

            foreach ($students as $student) {
                $req = Request::create('/api/v1/documents/report-card/pdf', 'GET', [
                    'student_id' => $student->id,
                    'session_id' => $this->sessionId,
                    'term_id' => $this->termId,
                    'template' => $this->templateStyle,
                ]);
                $resp = $docController->reportCardPdf($req);
                $bytes = $resp->getContent();
                if (str_starts_with($bytes, '%PDF-')) {
                    $safeAdm = preg_replace('/[^A-Za-z0-9_-]/', '_', $student->admission_number ?: (string) $student->id);
                    Storage::put("{$batchFolder}/ReportCard_{$safeAdm}.pdf", $bytes);
                    $compiledCount++;
                    $totalBytes += strlen($bytes);
                }
            }

            $meta = $dispatch->metadata ?? [];
            $meta['compiled_count'] = $compiledCount;
            $meta['total_bytes'] = $totalBytes;
            $meta['storage_folder'] = $batchFolder;

            $dispatch->update([
                'status' => 'completed',
                'provider_message_id' => "PDF-BATCH-{$compiledCount}",
                'metadata' => $meta,
                'completed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            $dispatch->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
        }
    }
}
