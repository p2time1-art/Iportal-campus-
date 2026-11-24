<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdmissionApplicationController extends Controller
{
    protected function resolveSchoolId(Request $request): int
    {
        $schoolId = $request->input('school_id') ?? $request->query('school_id');
        if (! empty($schoolId)) {
            return (int) $schoolId;
        }

        $user = $request->user();
        return (int) ($user?->active_school_id ?? 1);
    }

    public static function formatApplication(AdmissionApplication $app): array
    {
        $data = $app->application_data ?? [];
        $schoolMeta = $app->school?->metadata ?? [];
        $className = $data['class_name'] ?? null;
        if (! $className && ! empty($data['class_id'])) {
            $className = \App\Models\SchoolClass::where('id', $data['class_id'])->value('name');
        }

        return [
            'id' => $app->id,
            'school_id' => $app->school_id,
            'school_name' => $app->school?->name ?? '',
            'school_code' => $app->school?->code ?? $app->school?->short_name ?? '',
            'school_address' => $app->school?->address ?? '',
            'school_phone' => $app->school?->phone ?? '',
            'school_email' => $app->school?->email ?? '',
            'school_logo_url' => $schoolMeta['logo_url'] ?? $schoolMeta['crest_url'] ?? '',
            'application_number' => $app->public_reference ?: ($data['application_number'] ?? ('APP-' . str_pad((string) $app->id, 6, '0', STR_PAD_LEFT))),
            'applicant_name' => $app->applicant_name,
            'first_name' => $data['first_name'] ?? '',
            'surname' => $data['surname'] ?? '',
            'other_names' => $data['other_names'] ?? '',
            'email' => $app->email,
            'phone' => $app->phone,
            'programme' => $data['programme'] ?? '',
            'class_id' => $data['class_id'] ?? null,
            'class_name' => $className,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'address' => $data['address'] ?? null,
            'previous_school' => $data['previous_school'] ?? null,
            'previous_qualification' => $data['previous_qualification'] ?? null,
            'guardian_name' => $data['guardian_name'] ?? null,
            'guardian_phone' => $data['guardian_phone'] ?? null,
            'guardian_email' => $data['guardian_email'] ?? null,
            'notes' => $data['notes'] ?? null,
            'passport' => $data['passport'] ?? null,
            'birth_certificate' => $data['birth_certificate'] ?? null,
            'other_documents' => $data['other_documents'] ?? [],
            'fee_amount' => (float) ($data['fee_amount'] ?? 5000),
            'fee_paid' => (bool) ($data['fee_paid'] ?? in_array($app->status, ['submitted', 'under_review', 'approved', 'accepted', 'admitted', 'enrolled', 'paid'])),
            'payment_reference' => $data['payment_reference'] ?? null,
            'receipt_number' => $data['receipt_number'] ?? null,
            'paid_at' => $data['paid_at'] ?? null,
            'status' => $app->status === 'approved' ? 'accepted' : $app->status,
            'review_notes' => $app->decision_notes ?? ($data['review_notes'] ?? ''),
            'provisioned_student_id' => $app->provisioned_student_id,
            'provisioned_guardian_id' => $app->provisioned_guardian_id,
            'provisioned_at' => $app->provisioned_at
                ? (is_string($app->provisioned_at) ? $app->provisioned_at : $app->provisioned_at->toIso8601String())
                : null,
            'admission_number' => $data['admission_number'] ?? null,
            'enrolled_class_name' => $data['enrolled_class_name'] ?? null,
            'student_login_pin' => $data['student_login_pin'] ?? null,
            'parent_login_pin' => $data['parent_login_pin'] ?? null,
            'submitted_at' => $app->submitted_at?->toIso8601String() ?? $app->created_at?->toIso8601String(),
            'created_at' => $app->created_at?->toIso8601String(),
            'created_date' => $app->created_at?->toIso8601String(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = AdmissionApplication::with('school')->where('school_id', $schoolId);

        if ($request->filled('status')) {
            $st = $request->query('status');
            if ($st === 'accepted') {
                $query->whereIn('status', ['accepted', 'approved', 'admitted']);
            } else {
                $query->where('status', $st);
            }
        }

        $apps = $query->orderByDesc('id')->limit(500)->get();
        return response()->json($apps->map(fn (AdmissionApplication $a) => self::formatApplication($a)));
    }

    public function show(int $id): JsonResponse
    {
        $app = AdmissionApplication::with('school')->findOrFail($id);
        return response()->json(self::formatApplication($app));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $app = AdmissionApplication::with('school')->findOrFail($id);

        $validated = $request->validate([
            'status' => 'nullable|in:draft,submitted,under_review,approved,accepted,admitted,enrolled,rejected,paid',
            'review_notes' => 'nullable|string',
            'decision_notes' => 'nullable|string',
            'programme' => 'nullable|string',
            'class_id' => 'nullable',
        ]);

        $data = $app->application_data ?? [];
        if (isset($validated['programme'])) {
            $data['programme'] = $validated['programme'];
        }
        if (array_key_exists('class_id', $validated)) {
            $data['class_id'] = $validated['class_id'];
        }
        $notes = $validated['review_notes'] ?? $validated['decision_notes'] ?? $app->decision_notes;
        $data['review_notes'] = $notes;

        $newStatus = $validated['status'] ?? $app->status;
        $app->update([
            'status' => $newStatus,
            'decision_notes' => $notes,
            'decision_at' => now(),
            'reviewed_by' => $request->user()?->id,
            'application_data' => $data,
        ]);

        // Automatically queue Admission Acceptance email when application is accepted/approved
        if (in_array($newStatus, ['accepted', 'approved', 'admitted'], true) && ! empty($app->email)) {
            $ref = $app->public_reference ?: ('APP-' . str_pad((string) $app->id, 6, '0', STR_PAD_LEFT));
            \App\Services\TransactionalEmailService::queueEmail(
                $app->school_id,
                'admission_acceptance',
                $app->email,
                $app->applicant_name ?: 'Applicant',
                [
                    'applicantName' => $app->applicant_name,
                    'applicationNumber' => $ref,
                    'programme' => $data['programme'] ?? 'JSS 1',
                    'admissionLetterPdfUrl' => url("/api/v1/documents/admission-letter/{$ref}/pdf"),
                ]
            );
        }

        return response()->json(self::formatApplication($app->fresh('school')));
    }

    /**
     * POST /api/v1/admission-applications/{id}/enroll
     * One-Click Enroll & Provision Student + Parent Accounts in one atomic transaction.
     */
    public function enroll(Request $request, int $id): JsonResponse
    {
        $app = AdmissionApplication::with('school')->findOrFail($id);

        $validated = $request->validate([
            'class_id' => 'nullable|integer',
            'review_notes' => 'nullable|string',
        ]);

        try {
            $result = \App\Services\AdmissionProvisioningService::enrollAndProvision(
                $app,
                ! empty($validated['class_id']) ? (int) $validated['class_id'] : null,
                $request->user()?->id,
                $validated['review_notes'] ?? null
            );

            return response()->json([
                'data' => $result,
                'application' => self::formatApplication($app->fresh('school')),
            ], $result['already_provisioned'] ? 200 : 201);
        } catch (\RuntimeException $e) {
            $code = $e->getCode() === 422 ? 422 : 400;
            return response()->json([
                'error' => $e->getMessage(),
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $app = AdmissionApplication::findOrFail($id);
        $app->delete();
        return response()->json(['message' => 'Application deleted.']);
    }
}
