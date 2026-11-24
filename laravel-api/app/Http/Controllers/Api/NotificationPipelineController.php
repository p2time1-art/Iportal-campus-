<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\CompileBulkReportCardsJob;
use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\Attendance;
use App\Models\GuardianRelationship;
use App\Models\NotificationDispatch;
use App\Models\Result;
use App\Models\School;
use App\Models\Student;
use App\Models\StudentCharge;
use App\Models\Term;
use App\Models\User;
use App\Services\MessagingGatewayService;
use App\Services\TenantContext;
use App\Services\TransactionalEmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationPipelineController extends Controller
{
    protected function resolveSchoolId(Request $request): int
    {
        $schoolId = $request->input('school_id') ?? $request->query('school_id') ?? TenantContext::id();
        if (! empty($schoolId)) {
            return (int) $schoolId;
        }
        return (int) ($request->user()?->active_school_id ?? 1);
    }

    /**
     * GET /api/v1/pipeline/status
     * Returns Horizon / Queue worker metrics, active providers, and recent dispatches.
     */
    public function status(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $school = TenantContext::withoutScope(fn () => School::find($schoolId)) ?? School::first();

        $dispatches = TenantContext::withoutScope(fn () => NotificationDispatch::where('school_id', $school?->id)
            ->orderByDesc('id')
            ->limit(100)
            ->get());

        $counts = [
            'total' => $dispatches->count(),
            'queued' => $dispatches->where('status', 'queued')->count(),
            'processing' => $dispatches->where('status', 'processing')->count(),
            'delivered' => $dispatches->whereIn('status', ['sent', 'delivered', 'completed'])->count(),
            'failed' => $dispatches->where('status', 'failed')->count(),
            'emails_sent' => $dispatches->where('channel', 'email')->count(),
            'sms_sent' => $dispatches->where('channel', 'sms')->count(),
            'whatsapp_sent' => $dispatches->where('channel', 'whatsapp')->count(),
            'pdf_batches' => $dispatches->where('channel', 'pdf_batch')->count(),
        ];

        return response()->json([
            'queue_driver' => config('queue.default', 'redis'),
            'horizon_configured' => file_exists(config_path('horizon.php')),
            'email_provider' => TransactionalEmailService::resolveProvider($school),
            'supported_email_providers' => TransactionalEmailService::SUPPORTED_PROVIDERS,
            'sms_provider' => MessagingGatewayService::resolveProvider($school),
            'supported_sms_providers' => MessagingGatewayService::SUPPORTED_PROVIDERS,
            'metrics' => $counts,
            'dispatches' => $dispatches,
        ]);
    }

    /**
     * POST /api/v1/pipeline/emails/dispatch
     * Queues transactional emails (welcome_onboarding, password_reset, termly_invoice, admission_acceptance).
     */
    public function dispatchEmail(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $school = TenantContext::withoutScope(fn () => School::find($schoolId)) ?? School::first();

        $templateKey = $request->input('template_key', 'welcome_onboarding');
        $providerOverride = $request->input('provider');
        if ($providerOverride && in_array($providerOverride, TransactionalEmailService::SUPPORTED_PROVIDERS, true)) {
            $meta = $school->metadata ?? [];
            $meta['email_provider'] = $providerOverride;
            $school->update(['metadata' => $meta]);
        }

        $batchId = 'EMAIL-BATCH-' . strtoupper(Str::random(8));
        $dispatched = [];

        if ($templateKey === 'termly_invoice') {
            $studentId = $request->input('student_id');
            $sessionId = $request->input('session_id');
            $termId = $request->input('term_id');

            $studentsQuery = TenantContext::withoutScope(fn () => Student::with(['currentClass', 'user'])->where('school_id', $school->id)->where('status', 'active'));
            if ($studentId) {
                $studentsQuery->where('id', $studentId);
            }
            $students = $studentsQuery->limit(100)->get();

            foreach ($students as $student) {
                $charges = TenantContext::withoutScope(fn () => StudentCharge::with('paymentAllocations.payment')
                    ->where('school_id', $school->id)
                    ->where('student_id', $student->id)
                    ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
                    ->when($termId, fn ($q) => $q->where('term_id', $termId))
                    ->get());

                $billed = 0;
                $paid = 0;
                foreach ($charges as $c) {
                    if (in_array($c->status, ['cancelled', 'waived'], true)) continue;
                    $net = (float) ($c->net_amount > 0 ? $c->net_amount : max(0, $c->amount - ($c->discount_amount ?? 0)));
                    $p = (float) $c->paymentAllocations->filter(fn ($a) => $a->payment && $a->payment->status === 'success')->sum('amount');
                    $billed += $net;
                    $paid += $p;
                }
                $balance = max(0, $billed - $paid);
                $email = $student->email ?: ($student->user?->email ?: 'parent.' . strtolower($student->admission_number ?: $student->id) . '@example.com');

                $dispatched[] = TransactionalEmailService::queueEmail(
                    $school->id,
                    'termly_invoice',
                    $email,
                    $student->full_name ?: 'Parent / Guardian',
                    [
                        'studentName' => $student->full_name,
                        'admissionNumber' => $student->admission_number,
                        'className' => $student->currentClass?->name ?? 'Assigned Class',
                        'invoiceNumber' => 'INV-' . $student->id . '-' . date('Ymd'),
                        'totalBilled' => $billed,
                        'totalPaid' => $paid,
                        'balanceDue' => $balance,
                        'invoicePdfUrl' => rtrim(config('app.url', 'http://localhost:8000'), '/') . "/api/v1/documents/invoice/{$student->id}/pdf",
                    ],
                    null,
                    $batchId
                );
            }
        } elseif ($templateKey === 'admission_acceptance') {
            $appId = $request->input('application_id');
            $app = $appId
                ? TenantContext::withoutScope(fn () => AdmissionApplication::find($appId))
                : TenantContext::withoutScope(fn () => AdmissionApplication::where('school_id', $school->id)->first());

            $appName = $app?->applicant_name ?? $request->input('recipient_name', 'Applicant');
            $appEmail = $app?->email ?? $request->input('recipient_email', 'applicant@example.com');
            $appRef = $app?->public_reference ?? ('APP-' . date('Y') . '-001');
            $programme = $app?->application_data['programme'] ?? 'JSS 1';

            $dispatched[] = TransactionalEmailService::queueEmail(
                $school->id,
                'admission_acceptance',
                $appEmail,
                $appName,
                [
                    'applicantName' => $appName,
                    'applicationNumber' => $appRef,
                    'programme' => $programme,
                    'admissionLetterPdfUrl' => rtrim(config('app.url', 'http://localhost:8000'), '/') . "/api/v1/documents/admission-letter/{$appRef}/pdf",
                ],
                null,
                $batchId
            );
        } elseif ($templateKey === 'password_reset') {
            $email = $request->input('recipient_email', $request->user()?->email ?? 'user@example.com');
            $name = $request->input('recipient_name', $request->user()?->full_name ?? 'Portal User');
            $token = 'RST-' . strtoupper(Str::random(8));

            $dispatched[] = TransactionalEmailService::queueEmail(
                $school->id,
                'password_reset',
                $email,
                $name,
                [
                    'resetToken' => $token,
                    'resetUrl' => rtrim(config('app.url', 'http://localhost:5173'), '/') . '/reset-password?token=' . $token,
                ],
                null,
                $batchId
            );
        } else {
            // welcome_onboarding
            $email = $request->input('recipient_email', $request->user()?->email ?? 'newstudent@example.com');
            $name = $request->input('recipient_name', $request->user()?->full_name ?? 'New Student');
            $role = $request->input('role', 'student');

            $dispatched[] = TransactionalEmailService::queueEmail(
                $school->id,
                'welcome_onboarding',
                $email,
                $name,
                [
                    'role' => $role,
                    'loginEmail' => $email,
                    'admissionNumber' => $request->input('admission_number', 'ADM/2026/001'),
                    'temporaryPassword' => $request->input('temporary_password', 'Welcome@2026'),
                ],
                null,
                $batchId
            );
        }

        return response()->json([
            'status' => 'queued',
            'batch_id' => $batchId,
            'template_key' => $templateKey,
            'provider' => TransactionalEmailService::resolveProvider($school),
            'count' => count($dispatched),
            'dispatches' => $dispatched,
        ]);
    }

    /**
     * POST /api/v1/pipeline/alerts/dispatch
     * Queues Bulk SMS / WhatsApp alerts via Termii, Africa's Talking, or Twilio
     * for: attendance_absence, fee_payment_reminder, exam_result_release, emergency_school_closure.
     */
    public function dispatchAlert(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $school = TenantContext::withoutScope(fn () => School::find($schoolId)) ?? School::first();

        $alertType = $request->input('alert_type', 'attendance_absence');
        $channel = $request->input('channel', 'sms'); // 'sms' or 'whatsapp'
        $provider = $request->input('provider');

        if ($provider && in_array($provider, MessagingGatewayService::SUPPORTED_PROVIDERS, true)) {
            $meta = $school->metadata ?? [];
            $meta['sms_provider'] = $provider;
            $school->update(['metadata' => $meta]);
        }

        $recipients = [];

        if ($alertType === 'attendance_absence') {
            $date = $request->input('date', now()->toDateString());
            $absences = TenantContext::withoutScope(fn () => Attendance::with(['student.currentClass'])
                ->where('school_id', $school->id)
                ->where('status', 'absent')
                ->limit(100)
                ->get());

            if ($absences->isEmpty()) {
                $students = TenantContext::withoutScope(fn () => Student::with('currentClass')->where('school_id', $school->id)->limit(5)->get());
                foreach ($students as $s) {
                    $recipients[] = [
                        'phone' => $s->phone ?: '+2348030000001',
                        'name' => 'Parent of ' . $s->full_name,
                        'user_id' => $s->user_id,
                        'context' => [
                            'student_name' => $s->full_name,
                            'class_name' => $s->currentClass?->name ?? '',
                            'date' => $date,
                        ],
                    ];
                }
            } else {
                foreach ($absences as $att) {
                    $s = $att->student;
                    if (! $s) continue;
                    $recipients[] = [
                        'phone' => $s->phone ?: '+2348030000001',
                        'name' => 'Parent of ' . $s->full_name,
                        'user_id' => $s->user_id,
                        'context' => [
                            'student_name' => $s->full_name,
                            'class_name' => $s->currentClass?->name ?? '',
                            'date' => $att->attendance_date ?? $date,
                        ],
                    ];
                }
            }
        } elseif ($alertType === 'fee_payment_reminder') {
            $students = TenantContext::withoutScope(fn () => Student::with('currentClass')->where('school_id', $school->id)->where('status', 'active')->limit(100)->get());
            foreach ($students as $s) {
                $charges = TenantContext::withoutScope(fn () => StudentCharge::with('paymentAllocations.payment')
                    ->where('school_id', $school->id)
                    ->where('student_id', $s->id)
                    ->get());
                $due = 0;
                foreach ($charges as $c) {
                    if (in_array($c->status, ['cancelled', 'waived', 'paid'], true)) continue;
                    $net = (float) ($c->net_amount > 0 ? $c->net_amount : max(0, $c->amount - ($c->discount_amount ?? 0)));
                    $paid = (float) $c->paymentAllocations->filter(fn ($a) => $a->payment && $a->payment->status === 'success')->sum('amount');
                    $due += max(0, $net - $paid);
                }
                if ($due > 0 || empty($recipients)) {
                    $recipients[] = [
                        'phone' => $s->phone ?: '+2348030000002',
                        'name' => 'Parent of ' . $s->full_name,
                        'user_id' => $s->user_id,
                        'context' => [
                            'student_name' => $s->full_name,
                            'class_name' => $s->currentClass?->name ?? '',
                            'balance' => $due > 0 ? $due : 45000,
                        ],
                    ];
                }
            }
        } elseif ($alertType === 'exam_result_release') {
            $session = TenantContext::withoutScope(fn () => AcademicSession::where('school_id', $school->id)->where('status', 'active')->first());
            $term = TenantContext::withoutScope(fn () => Term::where('school_id', $school->id)->where('status', 'active')->first());
            $students = TenantContext::withoutScope(fn () => Student::with('currentClass')->where('school_id', $school->id)->where('status', 'active')->limit(100)->get());

            foreach ($students as $s) {
                $recipients[] = [
                    'phone' => $s->phone ?: '+2348030000003',
                    'name' => 'Parent of ' . $s->full_name,
                    'user_id' => $s->user_id,
                    'context' => [
                        'student_name' => $s->full_name,
                        'class_name' => $s->currentClass?->name ?? '',
                        'session_name' => $session?->name ?? '2026/2027',
                        'term_name' => $term?->name ?? 'Current Term',
                    ],
                ];
            }
        } else {
            // emergency_school_closure
            $customMsg = $request->input('custom_message');
            $students = TenantContext::withoutScope(fn () => Student::with('currentClass')->where('school_id', $school->id)->where('status', 'active')->limit(100)->get());
            foreach ($students as $s) {
                $recipients[] = [
                    'phone' => $s->phone ?: '+2348030000009',
                    'name' => 'Parent of ' . $s->full_name,
                    'user_id' => $s->user_id,
                    'context' => [
                        'student_name' => $s->full_name,
                        'custom_message' => $customMsg,
                        'date' => now()->format('d M Y'),
                    ],
                ];
            }
        }

        $result = MessagingGatewayService::queueAlert(
            $school->id,
            $alertType,
            $channel,
            $recipients,
            $provider
        );

        return response()->json($result);
    }

    /**
     * POST /api/v1/pipeline/report-cards/compile
     * Queues asynchronous background compilation of up to 500 report cards via CompileBulkReportCardsJob.
     */
    public function compileBulkReportCards(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $sessionId = $request->input('session_id') ? (int) $request->input('session_id') : null;
        $termId = $request->input('term_id') ? (int) $request->input('term_id') : null;
        $classId = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $templateStyle = $request->input('template', 'classic');

        $batchId = 'PDF-BATCH-' . strtoupper(Str::random(8));

        $studentCount = TenantContext::withoutScope(fn () => Student::where('school_id', $schoolId)
            ->where('status', 'active')
            ->when($classId, fn ($q) => $q->whereHas('classMemberships', fn ($sq) => $sq->where('class_id', $classId)))
            ->count());

        $dispatch = TenantContext::withoutScope(fn () => NotificationDispatch::create([
            'school_id' => $schoolId,
            'batch_id' => $batchId,
            'queue_name' => 'pdf-compilation',
            'channel' => 'pdf_batch',
            'provider' => 'dompdf',
            'template_key' => 'bulk_report_cards',
            'recipient' => "Class/School Batch ({$studentCount} Students)",
            'recipient_name' => 'Bulk Report Card Compilation',
            'subject' => "Compiling {$studentCount} Official Report Cards ({$templateStyle})",
            'message_body' => "Asynchronous background job compiling {$studentCount} report cards on queue 'pdf-compilation'.",
            'status' => 'queued',
            'metadata' => [
                'student_count' => $studentCount,
                'session_id' => $sessionId,
                'term_id' => $termId,
                'class_id' => $classId,
                'template' => $templateStyle,
            ],
        ]));

        CompileBulkReportCardsJob::dispatch(
            $dispatch->id,
            $schoolId,
            $sessionId,
            $termId,
            $classId,
            $templateStyle
        )->onQueue('pdf-compilation');

        return response()->json([
            'status' => 'queued',
            'batch_id' => $batchId,
            'dispatch_id' => $dispatch->id,
            'student_count' => $studentCount,
            'dispatch' => $dispatch->fresh(),
        ]);
    }
}
