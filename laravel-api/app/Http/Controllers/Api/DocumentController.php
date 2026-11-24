<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\Attendance;
use App\Models\GradingScheme;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Receipt;
use App\Models\Result;
use App\Models\School;
use App\Models\Student;
use App\Models\StudentCharge;
use App\Models\Term;
use App\Models\TermRemark;
use App\Services\DocumentPdfService;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DocumentController extends Controller
{
    /**
     * Handle general file/document uploads (used by admissions, assignments, school logos).
     * Automatically compresses raster images on the server as a safety net:
     *  - passport / logo / avatar / photo -> <= 20 KB
     *  - document images -> <= 100 KB
     * Non-image files (e.g. PDFs) are stored untouched.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:20480',
            'purpose' => 'nullable|string|max:40',
        ]);

        $file = $request->file('file');
        $purpose = strtolower((string) $request->input('purpose', 'document'));
        $isSmallPhoto = in_array($purpose, ['passport', 'logo', 'avatar', 'photo'], true);
        $maxBytes = $isSmallPhoto ? 20 * 1024 : 100 * 1024;
        $initialMaxDim = $isSmallPhoto ? 420 : 1400;
        $minDim = $isSmallPhoto ? 120 : 480;

        $mime = (string) ($file->getMimeType() ?: $file->getClientMimeType());
        $isRasterImage = in_array($mime, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'], true);

        $baseSafeName = preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
        $compressed = false;
        $finalSize = (int) $file->getSize();

        if ($isRasterImage && $finalSize > $maxBytes && function_exists('imagecreatefromstring')) {
            $raw = @file_get_contents($file->getRealPath());
            $srcImg = $raw !== false ? @imagecreatefromstring($raw) : false;

            if ($srcImg !== false) {
                $origW = imagesx($srcImg);
                $origH = imagesy($srcImg);
                $scale0 = min(1.0, $initialMaxDim / max(1, max($origW, $origH)));
                $w = max(1, (int) round($origW * $scale0));
                $h = max(1, (int) round($origH * $scale0));

                $qualities = [82, 68, 54, 42, 32, 24];
                $bestBytes = null;

                for ($pass = 0; $pass < 7; $pass++) {
                    $canvas = imagecreatetruecolor($w, $h);
                    $white = imagecolorallocate($canvas, 255, 255, 255);
                    imagefill($canvas, 0, 0, $white);
                    imagecopyresampled($canvas, $srcImg, 0, 0, 0, 0, $w, $h, $origW, $origH);

                    $hitTarget = false;
                    foreach ($qualities as $q) {
                        ob_start();
                        imagejpeg($canvas, null, $q);
                        $jpegBytes = ob_get_clean();
                        if ($jpegBytes === false) {
                            continue;
                        }
                        if ($bestBytes === null || strlen($jpegBytes) < strlen($bestBytes)) {
                            $bestBytes = $jpegBytes;
                        }
                        if (strlen($jpegBytes) <= $maxBytes) {
                            $hitTarget = true;
                            break;
                        }
                    }
                    imagedestroy($canvas);

                    if ($hitTarget || max($w, $h) <= $minDim) {
                        break;
                    }
                    $w = max($minDim, (int) round($w * 0.78));
                    $h = max($minDim, (int) round($h * 0.78));
                }
                imagedestroy($srcImg);

                if ($bestBytes !== null && strlen($bestBytes) < $finalSize) {
                    $stem = pathinfo($baseSafeName, PATHINFO_FILENAME) ?: 'image';
                    $filename = time() . '_' . $stem . '.jpg';
                    $uploadDir = storage_path('app/public/uploads');
                    if (! is_dir($uploadDir)) {
                        @mkdir($uploadDir, 0775, true);
                    }
                    file_put_contents($uploadDir . DIRECTORY_SEPARATOR . $filename, $bestBytes);
                    $path = 'public/uploads/' . $filename;
                    $url = asset('storage/uploads/' . $filename);
                    $compressed = true;
                    $finalSize = strlen($bestBytes);

                    return response()->json([
                        'url' => $url,
                        'file_url' => $url,
                        'filename' => $filename,
                        'path' => $path,
                        'purpose' => $purpose,
                        'compressed' => $compressed,
                        'size_bytes' => $finalSize,
                    ]);
                }
            }
        }

        $filename = time() . '_' . $baseSafeName;
        $path = $file->storeAs('public/uploads', $filename);
        $url = asset('storage/uploads/' . $filename);

        return response()->json([
            'url' => $url,
            'file_url' => $url,
            'filename' => $filename,
            'path' => $path,
            'purpose' => $purpose,
            'compressed' => $compressed,
            'size_bytes' => $finalSize,
        ]);
    }

    /**
     * Generate Official Academic Report Card / Transcript PDF.
     * Supports query/body params: student_id, session_id, term_id, template (classic|modern|compact).
     */
    public function reportCardPdf(Request $request): Response
    {
        $studentId = $request->input('student_id');
        $sessionId = $request->input('session_id');
        $termId = $request->input('term_id');
        $templateStyle = $request->input('template', 'classic');

        $student = TenantContext::withoutScope(fn () => Student::with('currentClass')->findOrFail($studentId));
        $school = TenantContext::withoutScope(fn () => School::find($student->school_id)) ?? School::first();

        $session = $sessionId ? TenantContext::withoutScope(fn () => AcademicSession::find($sessionId)) : null;
        $term = $termId ? TenantContext::withoutScope(fn () => Term::find($termId)) : null;

        $resultsQuery = TenantContext::withoutScope(fn () => Result::with(['subject'])
            ->where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->get());

        $scheme = TenantContext::withoutScope(fn () => GradingScheme::where('school_id', $student->school_id)->first());

        $components = $scheme?->metadata['components'] ?? [
            ['key' => 'c1', 'label' => 'CA 1', 'max_score' => 20],
            ['key' => 'c2', 'label' => 'CA 2', 'max_score' => 20],
            ['key' => 'exam', 'label' => 'Exam', 'max_score' => 60],
        ];
        $gradeScale = $scheme?->grade_scale ?? [
            ['grade' => 'A', 'min_score' => 70, 'max_score' => 100, 'remark' => 'Excellent'],
            ['grade' => 'B', 'min_score' => 60, 'max_score' => 69, 'remark' => 'Very Good'],
            ['grade' => 'C', 'min_score' => 50, 'max_score' => 59, 'remark' => 'Credit'],
            ['grade' => 'D', 'min_score' => 45, 'max_score' => 49, 'remark' => 'Pass'],
            ['grade' => 'F', 'min_score' => 0, 'max_score' => 44, 'remark' => 'Fail'],
        ];

        $formattedResults = [];
        $sumTotal = 0;
        foreach ($resultsQuery as $r) {
            $totalScore = (float) ($r->score ?? $r->total_score ?? 0);
            $compMap = $r->metadata['components'] ?? [];
            if (empty($compMap)) {
                $compMap = [
                    'c1' => round($totalScore * 0.2, 1),
                    'c2' => round($totalScore * 0.2, 1),
                    'exam' => round($totalScore * 0.6, 1),
                ];
            }
            $sumTotal += $totalScore;
            $formattedResults[] = [
                'subject_name' => $r->subject?->name ?? ($r->metadata['subject_name'] ?? 'Subject'),
                'components' => $compMap,
                'total_score' => $totalScore,
                'grade' => $r->grade ?? '—',
                'grade_point' => $r->metadata['grade_point'] ?? '—',
                'subject_position' => \App\Services\ResultRankingService::formatOrdinal($r->subject_position),
                'subject_average' => $r->subject_average !== null ? number_format((float) $r->subject_average, 1) : '—',
                'remark' => $r->remarks ?? ($r->metadata['remark'] ?? '—'),
            ];
        }

        $subjectCount = count($formattedResults);
        $avg = $subjectCount > 0 ? round($sumTotal / $subjectCount, 1) : 0;
        $overallGrade = '—';
        foreach ($gradeScale as $band) {
            if ($avg >= ($band['min_score'] ?? 0) && $avg <= ($band['max_score'] ?? 100)) {
                $overallGrade = $band['grade'] ?? '—';
                break;
            }
        }

        $attendanceRows = TenantContext::withoutScope(fn () => Attendance::where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->get());

        $totalAtt = $attendanceRows->count();
        $presentAtt = $attendanceRows->where('status', 'present')->count();
        $absentAtt = $attendanceRows->where('status', 'absent')->count();
        $attRate = $totalAtt > 0 ? round(($presentAtt / $totalAtt) * 100) : 0;

        $remark = TenantContext::withoutScope(fn () => TermRemark::where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->first());
        if ($remark) {
            $remark->class_teacher_remark = $remark->class_teacher_remark ?: ($remark->comment ?? 'Satisfactory academic progress.');
            $remark->principal_remark = $remark->principal_remark ?: ($remark->comment ?? 'Keep striving for academic excellence.');
        }

        $computedPos = $remark?->class_position
            ? \App\Services\ResultRankingService::formatOrdinal((int) $remark->class_position)
                . ($remark->class_size ? " of {$remark->class_size}" : '')
            : ($remark?->metadata['class_position'] ?? null);

        $refKey = ($student->admission_number ?: $student->id) . '-' . ($session?->name ?: 'S') . '-' . ($term?->name ?: 'T');
        $verificationCode = DocumentPdfService::generateVerificationCode('REP', $student->id, $refKey, $avg);
        $verifyUrl = rtrim(config('app.url', 'http://localhost:8000'), '/') . "/api/v1/documents/verify/{$verificationCode}?type=REP&id={$student->id}";
        $qrCodeDataUri = DocumentPdfService::generateQrSvgDataUri("VERIFY|REPORT_CARD|{$verificationCode}|{$student->full_name}|AVG:{$avg}%|{$verifyUrl}");
        $principalSignature = DocumentPdfService::generatePrincipalSignatureDataUri($school->metadata['principal_name'] ?? 'Principal', $school->primary_color ?? '#1e3a8a');

        $data = [
            'school' => $school,
            'schoolLogo' => $school->logo_url ?? null,
            'primaryColor' => $school->primary_color ?: '#0f172a',
            'secondaryColor' => $school->secondary_color ?: '#f97316',
            'templateStyle' => $templateStyle,
            'templateTitle' => $request->input('transcript') ? 'OFFICIAL ACADEMIC TRANSCRIPT' : 'OFFICIAL REPORT CARD',
            'student' => $student,
            'studentPhoto' => $student->photo_url ?? null,
            'className' => $student->currentClass?->name ?? ($student->metadata['current_class_name'] ?? '—'),
            'sessionName' => $session?->name ?? '',
            'termName' => $term?->name ?? '',
            'results' => $formattedResults,
            'components' => $components,
            'gradeScale' => $gradeScale,
            'overall' => [
                'total' => $sumTotal,
                'maxTotal' => $subjectCount * 100,
                'average' => $avg,
                'grade' => $overallGrade,
            ],
            'attendanceSummary' => [
                'total' => $totalAtt,
                'present' => $presentAtt,
                'absent' => $absentAtt,
                'rate' => $attRate,
            ],
            'remark' => $remark,
            'classPosition' => $computedPos,
            'principalName' => $school->metadata['principal_name'] ?? 'School Principal',
            'principalSignature' => $principalSignature,
            'verificationCode' => $verificationCode,
            'verifyUrl' => $verifyUrl,
            'qrCodeDataUri' => $qrCodeDataUri,
        ];

        $filename = 'ReportCard_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $student->full_name ?: 'Student') . '.pdf';

        return DocumentPdfService::renderPdfResponse('documents.report-card', $data, $filename);
    }

    /**
     * Generate Official Payment Receipt PDF with Anti-Forgery QR Code.
     */
    public function receiptPdf(Request $request, string|int $id): Response
    {
        $receipt = TenantContext::withoutScope(fn () => Receipt::with('payment.student.currentClass')->find($id));
        $payment = $receipt?->payment;

        if (! $payment) {
            $payment = TenantContext::withoutScope(fn () => Payment::with(['student.currentClass', 'receipts'])->findOrFail($id));
            $receipt = $payment->receipts->first();
        }

        $student = $payment->student;
        $school = TenantContext::withoutScope(fn () => School::find($payment->school_id)) ?? School::first();

        $session = $payment->academic_session_id
            ? TenantContext::withoutScope(fn () => AcademicSession::find($payment->academic_session_id))
            : null;
        $term = $payment->term_id
            ? TenantContext::withoutScope(fn () => Term::find($payment->term_id))
            : null;

        $allocModels = TenantContext::withoutScope(fn () => PaymentAllocation::with('studentCharge.feeStructure.category')
            ->where('payment_id', $payment->id)
            ->get());

        $allocations = [];
        foreach ($allocModels as $a) {
            $allocations[] = [
                'category_name' => $a->studentCharge?->feeStructure?->category?->name
                    ?? $a->studentCharge?->feeStructure?->name
                    ?? 'School Fee Payment',
                'amount' => (float) $a->amount,
            ];
        }
        if (empty($allocations)) {
            $allocations[] = [
                'category_name' => $payment->notes ?: 'School Fee Payment',
                'amount' => (float) $payment->amount,
            ];
        }

        $receiptNumber = $receipt?->receipt_number ?: ($payment->reference_number ?: 'REC-' . $payment->id);
        $paymentRef = $payment->reference_number ?: $receiptNumber;
        $amountPaid = (float) $payment->amount;
        $convenienceFee = (float) ($payment->metadata['convenience_fee'] ?? 0);

        $verificationCode = DocumentPdfService::generateVerificationCode('REC', $payment->id, $receiptNumber, $amountPaid);
        $verifyUrl = url("/api/v1/documents/verify/{$verificationCode}?type=REC&id={$payment->id}");
        $qrPayload = "VERIFY|RECEIPT|{$verificationCode}|{$receiptNumber}|REF:{$paymentRef}|NGN:{$amountPaid}|{$verifyUrl}";
        $qrCodeDataUri = DocumentPdfService::generateQrSvgDataUri($qrPayload);
        $principalSignature = DocumentPdfService::generatePrincipalSignatureDataUri('Bursar', $school->primary_color ?? '#0f172a');

        $data = [
            'school' => $school,
            'primaryColor' => $school->primary_color ?: '#0f172a',
            'secondaryColor' => $school->secondary_color ?: '#f97316',
            'student' => $student,
            'payment' => $payment,
            'receiptNumber' => $receiptNumber,
            'paymentReference' => $paymentRef,
            'paymentDate' => $payment->paid_at ? $payment->paid_at->format('d M Y') : $payment->created_at?->format('d M Y'),
            'paymentMethod' => $payment->payment_method ?: 'Online',
            'className' => $student?->currentClass?->name ?? '',
            'sessionName' => $session?->name ?? '',
            'termName' => $term?->name ?? '',
            'allocations' => $allocations,
            'amountPaid' => $amountPaid,
            'convenienceFee' => $convenienceFee,
            'verificationCode' => $verificationCode,
            'verifyUrl' => $verifyUrl,
            'qrCodeDataUri' => $qrCodeDataUri,
            'principalSignature' => $principalSignature,
        ];

        return DocumentPdfService::renderPdfResponse('documents.receipt', $data, "Receipt_{$receiptNumber}.pdf");
    }

    /**
     * Generate Official Student Fee Invoice / Statement PDF with QR Code.
     */
    public function invoicePdf(Request $request, string|int $studentId): Response
    {
        $student = TenantContext::withoutScope(fn () => Student::with('currentClass')->findOrFail($studentId));
        $school = TenantContext::withoutScope(fn () => School::find($student->school_id)) ?? School::first();

        $sessionId = $request->input('session_id');
        $termId = $request->input('term_id');

        $session = $sessionId ? TenantContext::withoutScope(fn () => AcademicSession::find($sessionId)) : null;
        $term = $termId ? TenantContext::withoutScope(fn () => Term::find($termId)) : null;

        $chargeModels = TenantContext::withoutScope(fn () => StudentCharge::with(['feeStructure.category', 'academicSession', 'term', 'paymentAllocations.payment'])
            ->where('school_id', $student->school_id)
            ->where('student_id', $student->id)
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->when($termId, fn ($q) => $q->where('term_id', $termId))
            ->get());

        $charges = [];
        $totalBilled = 0;
        $totalPaid = 0;

        foreach ($chargeModels as $c) {
            if (in_array($c->status, ['cancelled', 'waived'], true)) {
                continue;
            }
            $net = (float) ($c->net_amount > 0 ? $c->net_amount : max(0, $c->amount - ($c->discount_amount ?? 0)));
            $paid = (float) $c->paymentAllocations
                ->filter(fn ($a) => $a->payment && $a->payment->status === 'success')
                ->sum('amount');
            $bal = max(0, $net - $paid);

            $totalBilled += $net;
            $totalPaid += $paid;

            $charges[] = [
                'category_name' => $c->feeStructure?->category?->name ?? ($c->feeStructure?->name ?? 'School Fee'),
                'session_name' => $c->academicSession?->name ?? '',
                'term_name' => $c->term?->name ?? '',
                'amount' => (float) $c->amount,
                'discount_amount' => (float) ($c->discount_amount ?? 0),
                'net_amount' => $net,
                'amount_paid' => $paid,
                'balance' => $bal,
            ];
        }

        $totalBalance = max(0, $totalBilled - $totalPaid);
        $invoiceNumber = 'INV-' . ($student->id) . '-' . date('Ymd');
        $verificationCode = DocumentPdfService::generateVerificationCode('INV', $student->id, $invoiceNumber, $totalBilled);
        $verifyUrl = url("/api/v1/documents/verify/{$verificationCode}?type=INV&id={$student->id}");
        $qrCodeDataUri = DocumentPdfService::generateQrSvgDataUri("VERIFY|INVOICE|{$verificationCode}|{$invoiceNumber}|BAL:{$totalBalance}|{$verifyUrl}");

        $data = [
            'school' => $school,
            'primaryColor' => $school->primary_color ?: '#0f172a',
            'student' => $student,
            'className' => $student->currentClass?->name ?? '',
            'sessionName' => $session?->name ?? '',
            'termName' => $term?->name ?? '',
            'invoiceNumber' => $invoiceNumber,
            'charges' => $charges,
            'totalBilled' => $totalBilled,
            'totalPaid' => $totalPaid,
            'totalBalance' => $totalBalance,
            'verificationCode' => $verificationCode,
            'qrCodeDataUri' => $qrCodeDataUri,
        ];

        return DocumentPdfService::renderPdfResponse('documents.invoice', $data, "Invoice_{$student->admission_number}_{$invoiceNumber}.pdf");
    }

    /**
     * Generate Bulk Printable Student ID Card Sheets (or single student ID card) PDF.
     */
    public function studentIdCardsPdf(Request $request): Response
    {
        $schoolId = $request->input('school_id') ?: TenantContext::getSchoolId();
        $studentId = $request->input('student_id');
        $classId = $request->input('class_id');
        $studentIds = $request->input('student_ids');

        $query = TenantContext::withoutScope(fn () => Student::with('currentClass')->where('status', 'active'));
        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }
        if ($studentId) {
            $query->where('id', $studentId);
        } elseif (! empty($studentIds) && is_array($studentIds)) {
            $query->whereIn('id', $studentIds);
        } elseif ($classId) {
            $query->whereHas('classMemberships', fn ($q) => $q->where('class_id', $classId));
        }

        $students = $query->orderBy('id')->limit(100)->get();
        $school = $schoolId
            ? TenantContext::withoutScope(fn () => School::find($schoolId))
            : School::first();

        $activeSession = TenantContext::withoutScope(fn () => AcademicSession::where('school_id', $school?->id)
            ->where('status', 'active')
            ->first());

        $cards = [];
        foreach ($students as $s) {
            $code = DocumentPdfService::generateVerificationCode('IDC', $s->id, (string) $s->admission_number);
            $qr = DocumentPdfService::generateQrSvgDataUri("VERIFY|STUDENT_ID|{$code}|{$s->admission_number}|{$s->full_name}");
            $initials = strtoupper(substr($s->first_name ?: 'S', 0, 1) . substr($s->last_name ?: 'T', 0, 1));
            $cards[] = [
                'id' => $s->id,
                'full_name' => $s->full_name,
                'admission_number' => $s->admission_number ?: 'ADM-' . $s->id,
                'class_name' => $s->currentClass?->name ?: ($s->metadata['current_class_name'] ?? 'Assigned Class'),
                'gender' => $s->gender ?: '—',
                'photo' => $s->photo_url ?? null,
                'initials' => $initials,
                'verification_code' => $code,
                'qr_data_uri' => $qr,
            ];
        }

        $principalSignature = DocumentPdfService::generatePrincipalSignatureDataUri($school?->metadata['principal_name'] ?? 'Principal', $school?->primary_color ?? '#0f172a');

        $data = [
            'school' => $school,
            'primaryColor' => $school?->primary_color ?: '#0f172a',
            'secondaryColor' => $school?->secondary_color ?: '#f97316',
            'sessionName' => $activeSession?->name ?: '2026/2027',
            'cards' => $cards,
            'principalSignature' => $principalSignature,
        ];

        $filename = $studentId ? "Student_ID_Card_{$studentId}.pdf" : 'Bulk_Student_ID_Cards_Sheet.pdf';

        return DocumentPdfService::renderPdfResponse('documents.student-id-cards', $data, $filename);
    }

    /**
     * Generate Downloadable Official Provisional Admission Offer Letter PDF.
     * Supports lookup by application ID, application_number (e.g. APP-...), or student ID.
     */
    public function admissionLetterPdf(Request $request, string|int $id): Response
    {
        $app = TenantContext::withoutScope(fn () => AdmissionApplication::where('id', $id)
            ->orWhere('public_reference', $id)
            ->first());

        $student = null;
        if (! $app) {
            $student = TenantContext::withoutScope(fn () => Student::with('currentClass')->findOrFail($id));
        }

        $schoolId = $app?->school_id ?? $student?->school_id;
        $school = TenantContext::withoutScope(fn () => School::find($schoolId)) ?? School::first();
        $activeSession = TenantContext::withoutScope(fn () => AcademicSession::where('school_id', $school?->id)
            ->where('status', 'active')
            ->first());
        $activeTerm = TenantContext::withoutScope(fn () => Term::where('school_id', $school?->id)
            ->where('status', 'active')
            ->first());

        $appData = $app?->application_data ?? [];
        $applicantName = $app
            ? ($app->applicant_name ?: trim(($appData['first_name'] ?? '') . ' ' . ($appData['surname'] ?? '')) ?: 'Applicant')
            : ($student?->full_name ?? 'Student');
        $referenceNumber = $app
            ? ($app->public_reference ?: ($appData['application_number'] ?? ('APP-' . str_pad((string) $app->id, 6, '0', STR_PAD_LEFT))))
            : ($student?->admission_number ?: 'ADM-' . $id);
        $programmeOrClass = $appData['programme'] ?? ($student?->currentClass?->name ?? 'JSS 1');
        $entityId = $app?->id ?? $student?->id ?? 1;

        $verificationCode = DocumentPdfService::generateVerificationCode('ADM', $entityId, $referenceNumber);
        $verifyUrl = url("/api/v1/documents/verify/{$verificationCode}?type=ADM&id={$entityId}");
        $qrCodeDataUri = DocumentPdfService::generateQrSvgDataUri("VERIFY|ADMISSION_LETTER|{$verificationCode}|{$referenceNumber}|{$applicantName}|{$verifyUrl}");
        $principalSignature = DocumentPdfService::generatePrincipalSignatureDataUri($school?->metadata['principal_name'] ?? 'Principal', $school?->primary_color ?? '#0f172a');

        $data = [
            'school' => $school,
            'schoolLogo' => $school?->logo_url ?? null,
            'primaryColor' => $school?->primary_color ?: '#0f172a',
            'applicantName' => $applicantName,
            'applicantEmail' => $app?->email ?? $student?->email ?? '',
            'applicantPhone' => $app?->phone ?? $student?->phone ?? '',
            'guardianName' => $appData['guardian_name'] ?? '',
            'referenceNumber' => $referenceNumber,
            'programmeOrClass' => $programmeOrClass,
            'sessionName' => $activeSession?->name ?: '2026/2027',
            'termName' => $activeTerm?->name ?: 'First Term',
            'issueDate' => now()->format('d F Y'),
            'reviewNotes' => $app?->decision_notes ?? ($appData['review_notes'] ?? ''),
            'principalName' => $school?->metadata['principal_name'] ?? 'The Principal / Registrar',
            'principalSignature' => $principalSignature,
            'verificationCode' => $verificationCode,
            'qrCodeDataUri' => $qrCodeDataUri,
        ];

        $safeRef = preg_replace('/[^A-Za-z0-9_-]/', '_', $referenceNumber);

        return DocumentPdfService::renderPdfResponse('documents.admission-letter', $data, "Admission_Letter_{$safeRef}.pdf");
    }

    /**
     * Public Anti-Forgery Document Verification Endpoint (scanned from QR codes).
     */
    public function verifyDocument(Request $request, string $code): JsonResponse
    {
        $code = strtoupper(trim($code));
        $type = strtoupper((string) $request->query('type', substr(explode('-', $code)[1] ?? 'REC', 0, 3)));
        $id = $request->query('id');

        if ($type === 'REC' && $id) {
            $payment = TenantContext::withoutScope(fn () => Payment::with(['student', 'receipts'])->find($id));
            if ($payment) {
                $receiptNumber = $payment->receipts->first()?->receipt_number ?: ($payment->reference_number ?: 'REC-' . $payment->id);
                $valid = DocumentPdfService::verifyCode($code, 'REC', $payment->id, $receiptNumber, (float) $payment->amount);
                return response()->json([
                    'verified' => $valid,
                    'document_type' => 'Official Payment Receipt',
                    'verification_code' => $code,
                    'receipt_number' => $receiptNumber,
                    'reference_number' => $payment->reference_number,
                    'student_name' => $payment->student?->full_name,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency ?? 'NGN',
                    'status' => $payment->status,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                ], $valid ? 200 : 422);
            }
        }

        if ($type === 'ADM' && $id) {
            $app = TenantContext::withoutScope(fn () => AdmissionApplication::find($id));
            if ($app) {
                $valid = DocumentPdfService::verifyCode($code, 'ADM', $app->id, (string) $app->application_number);
                return response()->json([
                    'verified' => $valid,
                    'document_type' => 'Official Provisional Admission Letter',
                    'verification_code' => $code,
                    'application_number' => $app->application_number,
                    'applicant_name' => trim(($app->first_name ?? '') . ' ' . ($app->last_name ?? '')),
                    'status' => $app->status,
                ], $valid ? 200 : 422);
            }
        }

        if ($type === 'IDC' && $id) {
            $student = TenantContext::withoutScope(fn () => Student::find($id));
            if ($student) {
                $valid = DocumentPdfService::verifyCode($code, 'IDC', $student->id, (string) $student->admission_number);
                return response()->json([
                    'verified' => $valid,
                    'document_type' => 'Official Student Identity Card',
                    'verification_code' => $code,
                    'student_name' => $student->full_name,
                    'admission_number' => $student->admission_number,
                    'status' => $student->status,
                ], $valid ? 200 : 422);
            }
        }

        $formatValid = (bool) preg_match('/^IPC-(REC|REP|INV|IDC|ADM)-[A-F0-9]{12}$/', $code);

        return response()->json([
            'verified' => $formatValid,
            'verification_code' => $code,
            'document_type' => match ($type) {
                'REC' => 'Official Payment Receipt',
                'REP' => 'Official Academic Report Card',
                'INV' => 'Official Student Fee Invoice',
                'IDC' => 'Official Student Identity Card',
                'ADM' => 'Official Provisional Admission Letter',
                default => 'Official School Document',
            },
        ], $formatValid ? 200 : 422);
    }
}
