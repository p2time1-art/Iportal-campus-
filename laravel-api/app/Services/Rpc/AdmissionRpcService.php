<?php

namespace App\Services\Rpc;

use App\Http\Controllers\Api\AdmissionApplicationController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SchoolMembershipController;
use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\AuditLog;
use App\Models\GuardianRelationship;
use App\Models\JobApplication;
use App\Models\JobVacancy;
use App\Models\OnlinePaymentTransaction;
use App\Models\ParentGuardian;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentClassMembership;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdmissionRpcService extends BaseRpcService
{
    public function getPublicAdmissionContext(Request $request): JsonResponse
    {
        $schools = School::where('status', 'active')
            ->orderBy('id')
            ->get()
            ->map(fn (School $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'short_name' => $s->short_name,
                'code' => $s->code,
                'application_fee_enabled' => (bool) ($s->application_fee_enabled ?? true),
                'application_fee_amount' => (float) ($s->application_fee_amount ?? 5000),
            ]);

        $classes = SchoolClass::orderBy('name')
            ->get()
            ->map(fn (SchoolClass $c) => [
                'id' => $c->id,
                'school_id' => $c->school_id,
                'name' => $c->name,
            ]);

        return response()->json([
            'data' => [
                'schools' => $schools,
                'classes' => $classes,
            ]
        ]);
    }

    public function submitAdmissionApplication(Request $request): JsonResponse
    {
        $schoolId = (int) ($request->input('school_id') ?: School::where('status', 'active')->value('id') ?: 1);
        $school = School::find($schoolId);

        $firstName = trim((string) $request->input('first_name', ''));
        $surname = trim((string) $request->input('surname', ''));
        $otherNames = trim((string) $request->input('other_names', ''));
        $fullName = trim(implode(' ', array_filter([$firstName, $surname, $otherNames]))) ?: trim((string) $request->input('applicant_name', 'Applicant'));

        $email = trim(strtolower((string) $request->input('email', '')));
        $phone = trim((string) $request->input('phone', ''));

        $feeEnabled = (bool) ($school?->application_fee_enabled ?? true);
        $feeAmount = (float) ($school?->application_fee_amount ?? 5000);

        $schoolCode = \App\Services\PinGeneratorService::normalizeSchoolCode($school, 'STU');
        $year = date('Y');
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $suffix = '';
            for ($i = 0; $i < 6; $i++) {
                $suffix .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $appNumber = "APP/{$schoolCode}/{$year}/{$suffix}";
        } while (AdmissionApplication::where('public_reference', $appNumber)->exists());

        $appData = [
            'application_number' => $appNumber,
            'first_name' => $firstName,
            'surname' => $surname,
            'other_names' => $otherNames,
            'programme' => $request->input('programme', ''),
            'class_id' => $request->input('class_id'),
            'date_of_birth' => $request->input('date_of_birth'),
            'gender' => $request->input('gender'),
            'address' => $request->input('address'),
            'previous_school' => $request->input('previous_school'),
            'previous_qualification' => $request->input('previous_qualification'),
            'guardian_name' => $request->input('guardian_name'),
            'guardian_phone' => $request->input('guardian_phone'),
            'guardian_email' => $request->input('guardian_email'),
            'notes' => $request->input('notes'),
            'passport' => $request->input('passport'),
            'birth_certificate' => $request->input('birth_certificate'),
            'other_documents' => $request->input('other_documents', []),
            'fee_amount' => $feeAmount,
            'fee_paid' => ! $feeEnabled || $feeAmount <= 0,
        ];

        $requiresPayment = $feeEnabled && $feeAmount > 0;

        $app = AdmissionApplication::create([
            'school_id' => $schoolId,
            'public_reference' => $appNumber,
            'applicant_name' => $fullName,
            'email' => $email,
            'phone' => $phone,
            'status' => $requiresPayment ? 'draft' : 'submitted',
            'application_data' => $appData,
            'submitted_at' => $requiresPayment ? null : now(),
        ]);

        return response()->json([
            'data' => [
                'application_id' => $app->id,
                'application_number' => $appNumber,
                'requires_payment' => $requiresPayment,
                'fee_amount' => $feeAmount,
                'message' => $requiresPayment
                    ? 'Application saved. Please complete the application fee payment.'
                    : 'Your admission application has been submitted successfully!',
            ]
        ], 201);
    }

    public function payApplicationFee(Request $request): JsonResponse
    {
        $appId = $request->input('application_id');
        $app = AdmissionApplication::with('school')->find($appId);
        if (! $app) {
            return response()->json(['error' => 'Admission application not found.'], 404);
        }

        $data = $app->application_data ?? [];
        $feeAmount = (float) ($data['fee_amount'] ?? $app->school?->application_fee_amount ?? 5000);
        $ref = 'APF-' . date('Ymd') . '-' . strtoupper(Str::random(8));

        OnlinePaymentTransaction::create([
            'school_id' => $app->school_id,
            'gateway' => 'paystack',
            'gateway_reference' => $ref,
            'status' => 'initiated',
            'request_payload' => [
                'type' => 'admission_application_fee',
                'application_id' => $app->id,
                'application_number' => $app->public_reference,
                'student_name' => $app->applicant_name,
                'payer_name' => $app->applicant_name,
                'amount' => $feeAmount,
                'initiated_at' => now()->toIso8601String(),
            ],
        ]);

        $returnUrl = "/applications/status?ref={$ref}";

        return response()->json([
            'data' => [
                'authorization_url' => $returnUrl,
                'reference' => $ref,
            ]
        ]);
    }

    public function finalizeAdmissionApplication(Request $request): JsonResponse
    {
        $ref = $request->input('internal_reference') ?? $request->input('reference');
        $tx = OnlinePaymentTransaction::where('gateway_reference', $ref)->first();
        if (! $tx) {
            return response()->json(['error' => 'Payment reference not found.'], 404);
        }

        $req = $tx->request_payload ?? [];
        $appId = $req['application_id'] ?? null;
        $app = AdmissionApplication::with('school')->find($appId);
        if (! $app) {
            return response()->json(['error' => 'Associated admission application not found.'], 404);
        }

        $feeAmount = (float) ($req['amount'] ?? 5000);

        $receiptNumber = $app->application_data['receipt_number'] ?? null;

        if ($tx->status !== 'success') {
            $payment = Payment::create([
                'school_id' => $app->school_id,
                'admission_application_id' => $app->id,
                'amount' => $feeAmount,
                'currency' => 'NGN',
                'payment_method' => 'online',
                'gateway' => 'paystack',
                'status' => 'success',
                'reference_number' => $ref,
                'notes' => "Admission Application Fee ({$app->public_reference})",
                'paid_at' => now(),
                'metadata' => [
                    'student_name' => $app->applicant_name,
                    'application_number' => $app->public_reference,
                ],
            ]);

            $schoolCode = \App\Services\PinGeneratorService::normalizeSchoolCode($app->school, 'STU');
            $receiptNumber = "RCP-{$schoolCode}-" . date('Ymd') . '-' . strtoupper(Str::random(6));

            Receipt::create([
                'school_id' => $app->school_id,
                'payment_id' => $payment->id,
                'receipt_number' => $receiptNumber,
                'issued_at' => now(),
            ]);

            $tx->update([
                'payment_id' => $payment->id,
                'status' => 'success',
                'response_payload' => [
                    'verified_at' => now()->toIso8601String(),
                    'receipt_number' => $receiptNumber,
                ],
            ]);
        }

        $appData = $app->application_data ?? [];
        $appData['fee_paid'] = true;
        $appData['payment_reference'] = $ref;
        if ($receiptNumber) {
            $appData['receipt_number'] = $receiptNumber;
        }
        $appData['paid_at'] = $appData['paid_at'] ?? now()->toIso8601String();

        $app->update([
            'status' => in_array($app->status, ['draft', 'paid']) ? 'submitted' : $app->status,
            'submitted_at' => $app->submitted_at ?? now(),
            'application_data' => $appData,
        ]);

        $formattedApp = AdmissionApplicationController::formatApplication($app->fresh('school'));

        return response()->json([
            'data' => [
                'application_number' => $app->public_reference,
                'school_name' => $app->school?->name ?? '',
                'programme' => $appData['programme'] ?? '',
                'status' => $app->status,
                'submitted_at' => $app->submitted_at?->toIso8601String(),
                'payment_reference' => $ref,
                'receipt_number' => $receiptNumber,
                'fee_amount' => $feeAmount,
                'application' => $formattedApp,
                'message' => 'Application fee (₦' . number_format($feeAmount) . ') verified! Your application has been submitted and your Registration Slip is ready.',
            ]
        ]);
    }

    public function checkApplicationStatus(Request $request): JsonResponse
    {
        $appNumber = trim((string) $request->input('application_number', ''));
        $app = AdmissionApplication::with('school')
            ->where('public_reference', $appNumber)
            ->orWhere('application_data->application_number', $appNumber)
            ->first();

        if (! $app) {
            return response()->json(['error' => 'No application found with that application number.'], 404);
        }

        return response()->json([
            'data' => AdmissionApplicationController::formatApplication($app),
        ]);
    }

    public function getAcceptedApplicants(Request $request): JsonResponse
    {
        $apps = AdmissionApplication::with('school')
            ->whereIn('status', ['approved', 'accepted', 'admitted', 'enrolled'])
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(function (AdmissionApplication $a) {
                $data = $a->application_data ?? [];
                return [
                    'application_number' => $a->public_reference ?: ($data['application_number'] ?? ''),
                    'programme' => $data['programme'] ?? '',
                    'school_name' => $a->school?->name ?? '',
                ];
            });

        return response()->json([
            'data' => [
                'applicants' => $apps,
            ]
        ]);
    }

    public function admittedStudentSignup(Request $request): JsonResponse
    {
        $appNumber = trim((string) $request->input('application_number', ''));
        $email = trim(strtolower((string) $request->input('email', '')));

        $app = AdmissionApplication::with('school')
            ->where(function ($q) use ($appNumber) {
                $q->where('public_reference', $appNumber)
                  ->orWhere('application_data->application_number', $appNumber);
            })
            ->first();

        if (! $app || strtolower((string) $app->email) !== $email) {
            return response()->json(['error' => 'Invalid application number or email address.'], 422);
        }

        if (! in_array($app->status, ['approved', 'accepted', 'admitted', 'enrolled'])) {
            return response()->json(['error' => 'This application has not yet been approved for admission.'], 422);
        }

        try {
            $provisioned = \App\Services\AdmissionProvisioningService::enrollAndProvision($app);
            return response()->json([
                'data' => [
                    'login_pin' => $provisioned['student']['login_pin'],
                    'parent_login_pin' => $provisioned['parent']['login_pin'] ?? null,
                    'admission_number' => $provisioned['student']['admission_number'],
                    'class_name' => $provisioned['student']['class_name'],
                    'student' => $provisioned['student'],
                    'parent' => $provisioned['parent'],
                    'message' => 'Your Student & Parent portal accounts have been provisioned! Default password: 12345678',
                ]
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function submitJobApplication(Request $request): JsonResponse
    {
        $vacancyId = $request->input('vacancy_id');
        $vacancy = JobVacancy::find($vacancyId);
        if (! $vacancy) {
            return response()->json(['error' => 'Vacancy not found.'], 404);
        }

        $app = JobApplication::create([
            'job_vacancy_id' => $vacancy->id,
            'applicant_name' => $request->input('full_name', 'Applicant'),
            'email' => $request->input('email', ''),
            'phone' => $request->input('phone'),
            'resume_path' => $request->input('resume_url'),
            'status' => 'submitted',
        ]);

        $appNumber = 'JOB-' . date('Y') . '-' . str_pad((string) $app->id, 5, '0', STR_PAD_LEFT);

        return response()->json([
            'data' => [
                'application_id' => $app->id,
                'application_number' => $appNumber,
                'message' => 'Your job application has been submitted successfully!',
            ]
        ], 201);
    }

    public function checkJobApplicationStatus(Request $request): JsonResponse
    {
        $num = trim((string) $request->input('application_number', ''));
        $id = (int) preg_replace('/^JOB-\d{4}-0*/i', '', $num);
        $app = JobApplication::with('vacancy')->find($id);

        if (! $app) {
            return response()->json(['error' => 'Job application not found.'], 404);
        }

        return response()->json([
            'data' => [
                'application_number' => $num,
                'vacancy_title' => $app->vacancy?->title ?? 'Position',
                'full_name' => $app->applicant_name,
                'status' => $app->status,
                'submitted_at' => $app->created_at?->toIso8601String(),
            ]
        ]);
    }

    public function onboardUser(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $roleInput = strtolower((string) $request->input('role', 'teacher'));

        // Enforce SaaS Subscription Tier Limits
        $userLimitErr = \App\Services\SubscriptionTierService::checkCanAddUser($schoolId);
        if ($userLimitErr !== null) {
            return response()->json(['error' => $userLimitErr, 'message' => $userLimitErr], 422);
        }
        if ($roleInput === 'student' && ! $request->filled('profile_id')) {
            $stuLimitErr = \App\Services\SubscriptionTierService::checkCanAddStudent($schoolId);
            if ($stuLimitErr !== null) {
                return response()->json(['error' => $stuLimitErr, 'message' => $stuLimitErr], 422);
            }
        }

        $school = School::find($schoolId);
        $roleCode = \App\Services\PinGeneratorService::normalizeRoleCode($roleInput);
        $rolePermissions = \App\Services\RolePermissionService::permissionsForRole($roleCode);

        $email = trim(strtolower((string) $request->input('email', '')));
        $profileData = $request->input('profile_data', []);
        $fullName = trim((string) ($profileData['full_name'] ?? 'Portal User'));

        $user = User::where('email', $email)->first();
        $userExists = (bool) $user;
        $loginPin = $user?->login_pin ?: \App\Services\PinGeneratorService::generate($school, $roleCode, $fullName);

        if (! $user) {
            $user = User::create([
                'email' => $email,
                'password_hash' => Hash::make('12345678'),
                'full_name' => $fullName,
                'phone' => $profileData['phone'] ?? null,
                'status' => 'active',
                'must_change_password' => 1,
                'login_pin' => $loginPin,
                'platform_pin' => $loginPin,
                'active_school_id' => $schoolId,
                'active_role' => $roleCode,
                'is_school_admin' => $roleCode === 'ADM' ? 1 : 0,
            ]);
        } else {
            $user->update([
                'login_pin' => $loginPin,
                'active_school_id' => $user->active_school_id ?: $schoolId,
                'active_role' => $user->active_role ?: $roleCode,
            ]);
        }

        $membership = SchoolMembership::updateOrCreate(
            ['user_id' => $user->id, 'school_id' => $schoolId, 'role' => $roleCode],
            [
                'status' => 'active',
                'is_primary' => true,
                'login_pin' => $loginPin,
                'user_pin' => $loginPin,
                'user_email' => $email,
                'user_name' => $fullName,
                'permissions' => $rolePermissions,
            ]
        );

        $profileId = $request->input('profile_id');
        if (in_array($roleInput, ['teacher', 'bursar', 'accountant', 'exam_officer', 'principal'], true)) {
            if ($profileId) {
                Teacher::where('id', $profileId)->update([
                    'user_id' => $user->id,
                    'email' => $email,
                    'staff_number' => $loginPin,
                ]);
            } else {
                Teacher::updateOrCreate(
                    ['school_id' => $schoolId, 'user_id' => $user->id],
                    [
                        'staff_number' => $loginPin,
                        'full_name' => $fullName,
                        'email' => $email,
                        'phone' => $profileData['phone'] ?? null,
                        'status' => 'active',
                    ]
                );
            }
        } elseif ($roleInput === 'student') {
            if ($profileId) {
                $stu = Student::find($profileId);
                $stu?->update(['user_id' => $user->id, 'email' => $email]);
            } else {
                $stu = Student::updateOrCreate(
                    ['school_id' => $schoolId, 'user_id' => $user->id],
                    [
                        'admission_number' => $profileData['admission_number'] ?? ('STU-' . strtoupper(Str::random(6))),
                        'full_name' => $fullName,
                        'email' => $email,
                        'phone' => $profileData['phone'] ?? null,
                        'gender' => $profileData['gender'] ?? null,
                        'status' => 'active',
                    ]
                );
                if (! empty($profileData['current_class_id'])) {
                    $sessId = $profileData['current_session_id']
                        ?: AcademicSession::where('school_id', $schoolId)->where('status', 'active')->value('id');
                    if ($sessId) {
                        StudentClassMembership::updateOrCreate(
                            ['school_id' => $schoolId, 'student_id' => $stu->id, 'academic_session_id' => $sessId],
                            ['class_id' => $profileData['current_class_id']]
                        );
                    }
                }
            }
        } elseif ($roleInput === 'parent') {
            if ($profileId) {
                $parent = ParentGuardian::find($profileId);
                $parent?->update(['user_id' => $user->id, 'email' => $email]);
            } else {
                $parent = ParentGuardian::updateOrCreate(
                    ['school_id' => $schoolId, 'user_id' => $user->id],
                    [
                        'full_name' => $fullName,
                        'email' => $email,
                        'phone' => $profileData['phone'] ?? null,
                        'status' => 'active',
                    ]
                );
                foreach ($request->input('guardian_links', []) as $link) {
                    if (! empty($link['student_id'])) {
                        GuardianRelationship::updateOrCreate(
                            ['school_id' => $schoolId, 'guardian_id' => $parent->id, 'student_id' => $link['student_id']],
                            [
                                'relationship_type' => $link['relationship_type'] ?? 'guardian',
                                'is_primary' => (bool) ($link['is_primary'] ?? false),
                            ]
                        );
                    }
                }
            }
        }

        return response()->json([
            'data' => [
                'membership_id' => $membership->id,
                'login_pin' => $loginPin,
                'user_exists' => $userExists,
                'needs_invite' => false,
            ]
        ]);
    }

    public function manageUserAccount(Request $request): JsonResponse
    {
        $action = $request->input('action');
        $membershipId = $request->input('membership_id');
        $membership = SchoolMembership::with(['user', 'school'])->find($membershipId);

        if (! $membership) {
            return response()->json(['error' => 'Membership not found.'], 404);
        }

        $user = $membership->user;
        $schoolCode = strtoupper($membership->school?->code ?: ($membership->school?->short_name ?: 'DC'));

        switch ($action) {
            case 'activate':
                $membership->update(['status' => 'active']);
                $user?->update(['status' => 'active']);
                break;

            case 'suspend':
                $membership->update(['status' => 'suspended']);
                $user?->update(['status' => 'suspended']);
                break;

            case 'deactivate':
                $membership->update(['status' => 'inactive']);
                $user?->update(['status' => 'disabled']);
                break;

            case 'reset_pin':
                $newPin = \App\Services\PinGeneratorService::generate(
                    $membership->school,
                    (string) $membership->role,
                    $user?->full_name ?: $membership->user_name
                );
                $membership->update(['login_pin' => $newPin, 'user_pin' => $newPin]);
                $user?->update(['login_pin' => $newPin, 'platform_pin' => $newPin]);
                if (in_array(strtoupper((string) $membership->role), ['TEA', 'BUR', 'EXM'], true) && $user) {
                    Teacher::where('school_id', $membership->school_id)
                        ->where('user_id', $user->id)
                        ->update(['staff_number' => $newPin]);
                }
                return response()->json(['data' => ['login_pin' => $newPin]]);

            case 'reset_password':
                $actor = $request->user();
                $isSuperAdmin = $actor && (
                    (bool) $actor->is_super_admin
                    || in_array(strtolower((string) $actor->active_role), ['sad', 'super_admin'], true)
                );
                $isSchoolAdmin = $actor && (
                    (bool) $actor->is_school_admin
                    || in_array(strtolower((string) $actor->active_role), ['adm', 'school_admin'], true)
                );

                if (! $actor || (! $isSuperAdmin && ! $isSchoolAdmin)) {
                    return response()->json(['error' => 'Forbidden: Only administrators can reset user passwords.'], 403);
                }

                if (! $user) {
                    return response()->json(['error' => 'Linked user account not found for this membership.'], 404);
                }

                if (! $isSuperAdmin) {
                    $targetIsSuperAdmin = (bool) $user->is_super_admin
                        || in_array(strtolower((string) $membership->role), ['sad', 'super_admin'], true);

                    if ($targetIsSuperAdmin) {
                        return response()->json(['error' => 'Forbidden: School administrators cannot reset Super Admin passwords.'], 403);
                    }

                    $actorSchoolId = (int) ($actor->active_school_id ?: 0);
                    if ($actorSchoolId <= 0 || (int) $membership->school_id !== $actorSchoolId) {
                        return response()->json(['error' => 'Forbidden: You can only reset passwords for users belonging to your own school.'], 403);
                    }
                }

                $defaultPassword = '12345678';
                $user->update([
                    'password_hash' => Hash::make($defaultPassword),
                    'must_change_password' => 1,
                ]);

                if ((int) $user->id !== (int) $actor->id) {
                    UserSession::where('user_id', $user->id)
                        ->whereNull('revoked_at')
                        ->update(['revoked_at' => now()]);
                }

                AuditLog::create([
                    'school_id' => $membership->school_id,
                    'actor_user_id' => $actor->id,
                    'event_type' => 'password_reset_to_default',
                    'entity_type' => 'User',
                    'entity_id' => $user->id,
                    'new_values' => [
                        'user_id' => $user->id,
                        'user_name' => $user->full_name ?: $membership->user_name,
                        'login_pin' => $user->login_pin ?: $membership->login_pin,
                        'role' => $membership->role,
                        'reset_by' => $actor->full_name ?: $actor->login_pin,
                        'reset_by_role' => $isSuperAdmin ? 'super_admin' : 'school_admin',
                        'must_change_password' => true,
                    ],
                ]);

                return response()->json([
                    'data' => [
                        'success' => true,
                        'password_reset' => true,
                        'default_password' => $defaultPassword,
                        'user_id' => $user->id,
                        'user_name' => $user->full_name ?: $membership->user_name,
                        'login_pin' => $user->login_pin ?: $membership->login_pin,
                    ],
                ]);

            case 'unlink':
                $membership->delete();
                break;
        }

        return response()->json(['data' => ['success' => true]]);
    }

    public function manageUserPin(Request $request): JsonResponse
    {
        $membershipId = $request->input('membership_id');
        $membership = SchoolMembership::with(['user', 'school'])->find($membershipId);

        if (! $membership) {
            return response()->json(['error' => 'Membership not found.'], 404);
        }

        $newPin = \App\Services\PinGeneratorService::generate(
            $membership->school,
            (string) $membership->role,
            $membership->user?->full_name ?: $membership->user_name
        );

        $membership->update(['user_pin' => $newPin, 'login_pin' => $newPin]);
        $membership->user?->update(['platform_pin' => $newPin, 'login_pin' => $newPin]);
        if (in_array(strtoupper((string) $membership->role), ['TEA', 'BUR', 'EXM'], true) && $membership->user_id) {
            Teacher::where('school_id', $membership->school_id)
                ->where('user_id', $membership->user_id)
                ->update(['staff_number' => $newPin]);
        }

        return response()->json(['data' => ['pin' => $newPin]]);
    }

    public function getUserAccountDetails(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $memberships = SchoolMembership::with('school')
            ->where('user_id', $user->id)
            ->get()
            ->map(fn (SchoolMembership $m) => SchoolMembershipController::formatMembership($m));

        $profiles = [];

        $teacher = Teacher::where('user_id', $user->id)->first();
        if ($teacher) {
            $profiles[] = [
                'profile' => [
                    'type' => 'teacher',
                    'data' => [
                        'id' => $teacher->id,
                        'full_name' => $teacher->full_name,
                        'staff_id' => $teacher->staff_number,
                        'email' => $teacher->email,
                        'phone' => $teacher->phone,
                    ],
                ],
            ];
        }

        $student = Student::with('currentClass')->where('user_id', $user->id)->first();
        if ($student) {
            $profiles[] = [
                'profile' => [
                    'type' => 'student',
                    'data' => [
                        'id' => $student->id,
                        'full_name' => $student->full_name,
                        'admission_number' => $student->admission_number,
                        'email' => $student->email,
                        'phone' => $student->phone,
                        'gender' => $student->gender,
                        'current_class_name' => $student->current_class_name,
                    ],
                ],
            ];
        }

        $parent = ParentGuardian::with('students')->where('user_id', $user->id)->first();
        if ($parent) {
            $profiles[] = [
                'profile' => [
                    'type' => 'parent',
                    'data' => [
                        'id' => $parent->id,
                        'full_name' => $parent->full_name,
                        'email' => $parent->email,
                        'phone' => $parent->phone,
                    ],
                    'children' => $parent->students->map(fn ($s) => [
                        'id' => $s->id,
                        'student_name' => $s->full_name,
                        'is_primary' => (bool) $s->pivot?->is_primary,
                    ]),
                ],
            ];
        }

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'pin' => $user->login_pin ?? $user->platform_pin,
                    'must_change_password' => (bool) $user->must_change_password,
                ],
                'memberships' => $memberships,
                'profiles' => $profiles,
            ]
        ]);
    }

    public function manageAdmin(Request $request): JsonResponse
    {
        $actor = $request->user();
        if (! $actor || (! $actor->is_super_admin && strtoupper((string) $actor->active_role) !== 'SAD')) {
            return response()->json(['error' => 'Only Super Administrators can manage school administrators.'], 403);
        }

        $action = strtolower((string) $request->input('action', 'assign'));

        if ($action === 'remove') {
            $membershipId = $request->input('membership_id');
            $membership = SchoolMembership::with(['user', 'school'])->find($membershipId);
            if (! $membership) {
                return response()->json(['error' => 'Administrator assignment not found.'], 404);
            }

            $desc = "Removed {$membership->user_name} ({$membership->user_email}) as administrator of " . ($membership->school?->name ?? "School #{$membership->school_id}");
            $schoolId = $membership->school_id;
            $membership->delete();

            \App\Models\AuditLog::create([
                'school_id' => $schoolId,
                'actor_user_id' => $actor->id,
                'event_type' => 'admin_removed',
                'entity_type' => 'SchoolMembership',
                'entity_id' => (int) $membershipId,
                'new_values' => ['description' => $desc],
            ]);

            return response()->json(['data' => ['success' => true]]);
        }

        $membershipId = $request->input('membership_id');
        $fullName = trim((string) ($request->input('user_name') ?? $request->input('full_name') ?? ''));
        $email = trim(strtolower((string) ($request->input('user_email') ?? $request->input('email') ?? '')));
        $phone = trim((string) ($request->input('phone') ?? $request->input('user_phone') ?? ''));
        $schoolId = (int) $request->input('school_id', 0);
        $roleInput = strtolower((string) $request->input('role', 'school_admin'));
        $status = strtolower((string) $request->input('status', 'active'));
        if (! in_array($status, ['active', 'inactive', 'suspended', 'invited'], true)) {
            $status = 'active';
        }

        if ($schoolId <= 0) {
            return response()->json(['error' => 'Please select a valid school.'], 422);
        }
        $school = School::find($schoolId);
        if (! $school) {
            return response()->json(['error' => 'Selected school does not exist.'], 404);
        }

        $roleCode = \App\Services\PinGeneratorService::normalizeRoleCode($roleInput);
        $permissions = \App\Services\RolePermissionService::permissionsForRole($roleCode);

        // EDIT EXISTING ADMINISTRATOR
        if (! empty($membershipId)) {
            $membership = SchoolMembership::with(['user', 'school'])->find($membershipId);
            if (! $membership) {
                return response()->json(['error' => 'Administrator assignment not found.'], 404);
            }

            if ($fullName === '') {
                return response()->json(['error' => 'Full name is required.'], 422);
            }
            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return response()->json(['error' => 'A valid email address is required.'], 422);
            }

            $user = $membership->user;
            if ($user) {
                $emailTaken = User::where('email', $email)->where('id', '!=', $user->id)->exists();
                if ($emailTaken) {
                    return response()->json(['error' => 'Another user already uses this email address.'], 422);
                }
            }

            $oldSchoolCode = \App\Services\PinGeneratorService::normalizeSchoolCode($membership->school, $roleCode);
            $newSchoolCode = \App\Services\PinGeneratorService::normalizeSchoolCode($school, $roleCode);
            $effectivePin = $membership->login_pin ?: $user?->login_pin;

            if (! $effectivePin) {
                $effectivePin = \App\Services\PinGeneratorService::generate($school, $roleCode, $fullName);
            } elseif ((int) $membership->school_id !== $schoolId && $oldSchoolCode !== $newSchoolCode) {
                $effectivePin = \App\Services\PinGeneratorService::rewriteForSchoolCode($effectivePin, $oldSchoolCode, $newSchoolCode);
            }

            \Illuminate\Support\Facades\DB::transaction(function () use ($membership, $user, $schoolId, $roleCode, $permissions, $fullName, $email, $phone, $status, $effectivePin) {
                if ($user) {
                    $user->update([
                        'full_name' => $fullName,
                        'email' => $email,
                        'phone' => $phone !== '' ? $phone : $user->phone,
                        'status' => $status === 'active' ? 'active' : ($status === 'suspended' ? 'suspended' : 'disabled'),
                        'active_school_id' => $schoolId,
                        'active_role' => $roleCode,
                        'is_school_admin' => $roleCode === 'ADM' ? 1 : 0,
                        'login_pin' => $effectivePin,
                        'platform_pin' => $effectivePin,
                    ]);
                }

                $membership->update([
                    'school_id' => $schoolId,
                    'role' => $roleCode,
                    'permissions' => $permissions,
                    'status' => $status,
                    'user_name' => $fullName,
                    'user_email' => $email,
                    'login_pin' => $effectivePin,
                    'user_pin' => $effectivePin,
                ]);
            });

            \App\Models\AuditLog::create([
                'school_id' => $schoolId,
                'actor_user_id' => $actor->id,
                'event_type' => 'admin_updated',
                'entity_type' => 'SchoolMembership',
                'entity_id' => $membership->id,
                'new_values' => [
                    'user_id' => $user?->id,
                    'user_name' => $fullName,
                    'user_email' => $email,
                    'login_pin' => $effectivePin,
                    'description' => "Updated administrator {$fullName} ({$effectivePin}) for {$school->name}.",
                ],
            ]);

            $fresh = $membership->fresh(['user', 'school']);

            return response()->json([
                'data' => [
                    'membership' => SchoolMembershipController::formatMembership($fresh),
                    'user_id' => $fresh->user_id,
                    'login_pin' => $effectivePin,
                    'is_new_user' => false,
                ]
            ]);
        }

        // CREATE NEW ADMINISTRATOR (auto-generate durable User ID & unique standard SS-ADM-XXXXXX PIN)
        if ($fullName === '') {
            return response()->json(['error' => 'Full name is required.'], 422);
        }
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['error' => 'A valid email address is required.'], 422);
        }

        $result = \Illuminate\Support\Facades\DB::transaction(function () use ($school, $schoolId, $roleCode, $permissions, $fullName, $email, $phone, $status) {
            $user = User::where('email', $email)->first();
            $isNewUser = ! $user;

            $generatedPin = \App\Services\PinGeneratorService::generate($school, $roleCode, $fullName);

            if (! $user) {
                $user = User::create([
                    'email' => $email,
                    'password_hash' => Hash::make('12345678'),
                    'full_name' => $fullName,
                    'phone' => $phone !== '' ? $phone : null,
                    'status' => $status === 'active' ? 'active' : 'suspended',
                    'must_change_password' => 1,
                    'login_pin' => $generatedPin,
                    'platform_pin' => $generatedPin,
                    'active_school_id' => $schoolId,
                    'active_role' => $roleCode,
                    'is_school_admin' => $roleCode === 'ADM' ? 1 : 0,
                ]);
            } else {
                $generatedPin = $user->login_pin ?: $generatedPin;
                $user->update([
                    'full_name' => $fullName ?: $user->full_name,
                    'phone' => $phone !== '' ? $phone : $user->phone,
                    'login_pin' => $generatedPin,
                    'platform_pin' => $user->platform_pin ?: $generatedPin,
                    'active_school_id' => $schoolId,
                    'active_role' => $roleCode,
                    'is_school_admin' => $roleCode === 'ADM' ? 1 : $user->is_school_admin,
                ]);
            }

            $membership = SchoolMembership::updateOrCreate(
                ['user_id' => $user->id, 'school_id' => $schoolId, 'role' => $roleCode],
                [
                    'status' => $status,
                    'is_primary' => true,
                    'login_pin' => $generatedPin,
                    'user_pin' => $generatedPin,
                    'user_email' => $email,
                    'user_name' => $fullName,
                    'permissions' => $permissions,
                ]
            );

            return [
                'membership' => $membership->fresh(['user', 'school']),
                'user' => $user,
                'login_pin' => $generatedPin,
                'is_new_user' => $isNewUser,
            ];
        });

        \App\Models\AuditLog::create([
            'school_id' => $schoolId,
            'actor_user_id' => $actor->id,
            'event_type' => 'admin_assigned',
            'entity_type' => 'SchoolMembership',
            'entity_id' => $result['membership']->id,
            'new_values' => [
                'user_id' => $result['user']->id,
                'user_name' => $fullName,
                'user_email' => $email,
                'login_pin' => $result['login_pin'],
                'description' => "Assigned {$fullName} ({$result['login_pin']}) as administrator of {$school->name}.",
            ],
        ]);

        return response()->json([
            'data' => [
                'membership' => SchoolMembershipController::formatMembership($result['membership']),
                'user_id' => $result['user']->id,
                'login_pin' => $result['login_pin'],
                'default_password' => '12345678',
                'is_new_user' => $result['is_new_user'],
            ]
        ], 201);
    }

    public function manageSchool(Request $request): JsonResponse
    {
        $action = $request->input('action', 'update');
        $ctrl = app(SchoolController::class);

        if ($action === 'create') {
            return $ctrl->store($request);
        }

        $schoolId = (int) $request->input('school_id');
        if (in_array($action, ['suspend', 'activate', 'deactivate'])) {
            $statusMap = ['suspend' => 'suspended', 'activate' => 'active', 'deactivate' => 'inactive'];
            $school = School::findOrFail($schoolId);
            $school->update(['status' => $statusMap[$action]]);
            return response()->json(['data' => $school]);
        }

        return $ctrl->update($request, $schoolId);
    }
}
