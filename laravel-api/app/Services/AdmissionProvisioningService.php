<?php

namespace App\Services;

use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\GuardianRelationship;
use App\Models\ParentGuardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentClassMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdmissionProvisioningService
{
    /**
     * Atomically enrolls an admitted applicant and provisions:
     *  1. Student User account + SchoolMembership (STU) + Login PIN + Student profile
     *  2. SchoolClass assignment (StudentClassMembership) for the active AcademicSession
     *  3. Parent/Guardian User account + SchoolMembership (PAR) + Login PIN + ParentGuardian profile
     *  4. GuardianRelationship linking the parent as Primary Guardian to the student
     *  5. Queues Welcome Onboarding emails for both student and parent
     *
     * Idempotent: if already provisioned, returns the existing credentials without duplicating records.
     */
    public static function enrollAndProvision(
        AdmissionApplication $app,
        ?int $overrideClassId = null,
        ?int $reviewedByUserId = null,
        ?string $reviewNotes = null
    ): array {
        $app->loadMissing('school');
        $schoolId = (int) $app->school_id;
        $school = $app->school ?? TenantContext::withoutScope(fn () => School::find($schoolId));
        $schoolCode = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) ($school?->code ?: ($school?->short_name ?: 'IPC'))));
        if ($schoolCode === '') {
            $schoolCode = 'IPC';
        }

        $data = $app->application_data ?? [];

        // Idempotency Check: already provisioned?
        if ($app->provisioned_student_id) {
            $existingStudent = TenantContext::withoutScope(fn () => Student::with(['user', 'currentClass'])->find($app->provisioned_student_id));
            $existingGuardian = $app->provisioned_guardian_id
                ? TenantContext::withoutScope(fn () => ParentGuardian::with('user')->find($app->provisioned_guardian_id))
                : null;

            if ($existingStudent) {
                return [
                    'already_provisioned' => true,
                    'application_id' => $app->id,
                    'application_number' => $app->public_reference ?: ($data['application_number'] ?? ('APP-' . $app->id)),
                    'status' => $app->status,
                    'student' => [
                        'id' => $existingStudent->id,
                        'full_name' => $existingStudent->full_name,
                        'admission_number' => $existingStudent->admission_number,
                        'email' => $existingStudent->email,
                        'class_name' => $existingStudent->currentClass?->name ?? ($data['enrolled_class_name'] ?? 'Assigned Class'),
                        'login_pin' => $existingStudent->user?->login_pin ?? ($data['student_login_pin'] ?? null),
                        'default_password' => '12345678',
                    ],
                    'parent' => $existingGuardian ? [
                        'id' => $existingGuardian->id,
                        'full_name' => $existingGuardian->full_name,
                        'email' => $existingGuardian->email,
                        'phone' => $existingGuardian->phone,
                        'login_pin' => $existingGuardian->user?->login_pin ?? ($data['parent_login_pin'] ?? null),
                        'default_password' => '12345678',
                    ] : null,
                    'message' => 'Student and Parent portal accounts were already provisioned for this application.',
                ];
            }
        }

        // Enforce SaaS Subscription Tier Student Limit
        $studentLimitErr = SubscriptionTierService::checkCanAddStudent($schoolId);
        if ($studentLimitErr !== null) {
            throw new \RuntimeException($studentLimitErr, 422);
        }

        $result = DB::transaction(function () use ($app, $school, $schoolId, $schoolCode, $data, $overrideClassId, $reviewedByUserId, $reviewNotes) {
            // 1. Resolve Target Class & Active Session
            $activeSession = TenantContext::withoutScope(fn () => AcademicSession::where('school_id', $schoolId)
                ->where('status', 'active')
                ->first())
                ?? TenantContext::withoutScope(fn () => AcademicSession::where('school_id', $schoolId)->latest('id')->first());

            $classId = $overrideClassId ?: (! empty($data['class_id']) ? (int) $data['class_id'] : null);
            $targetClass = null;

            if ($classId) {
                $targetClass = TenantContext::withoutScope(fn () => SchoolClass::where('school_id', $schoolId)->find($classId));
            }
            if (! $targetClass && ! empty($data['programme'])) {
                $targetClass = TenantContext::withoutScope(fn () => SchoolClass::where('school_id', $schoolId)
                    ->where('name', 'like', '%' . trim((string) $data['programme']) . '%')
                    ->first());
            }
            if (! $targetClass) {
                $targetClass = TenantContext::withoutScope(fn () => SchoolClass::where('school_id', $schoolId)->orderBy('id')->first());
            }

            // 2. Provision Student User + SchoolMembership (STU) + Student Profile
            $studentName = trim((string) ($app->applicant_name ?: 'New Student'));
            $studentEmail = trim(strtolower((string) ($app->email ?: '')));
            if ($studentEmail === '') {
                $studentEmail = 'student.' . strtolower(Str::random(6)) . '@campus.local';
            }

            $studentLoginPin = PinGeneratorService::generate($school, 'STU', $studentName);
            $admNo = $schoolCode . '/' . date('Y') . '/' . str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
            while (TenantContext::withoutScope(fn () => Student::where('school_id', $schoolId)->where('admission_number', $admNo)->exists())) {
                $admNo = $schoolCode . '/' . date('Y') . '/' . str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
            }

            $studentUser = User::where('email', $studentEmail)->first();
            if (! $studentUser) {
                $studentUser = User::create([
                    'email' => $studentEmail,
                    'password_hash' => Hash::make('12345678'),
                    'full_name' => $studentName,
                    'phone' => $app->phone,
                    'status' => 'active',
                    'must_change_password' => true,
                    'login_pin' => $studentLoginPin,
                    'platform_pin' => $studentLoginPin,
                    'active_school_id' => $schoolId,
                    'active_role' => 'STU',
                ]);
            } else {
                $studentLoginPin = $studentUser->login_pin ?: $studentLoginPin;
                $studentUser->update([
                    'login_pin' => $studentLoginPin,
                    'active_school_id' => $schoolId,
                    'active_role' => 'STU',
                ]);
            }

            SchoolMembership::updateOrCreate(
                ['user_id' => $studentUser->id, 'school_id' => $schoolId, 'role' => 'STU'],
                [
                    'status' => 'active',
                    'is_primary' => true,
                    'login_pin' => $studentLoginPin,
                    'user_pin' => $studentLoginPin,
                    'user_email' => $studentEmail,
                    'user_name' => $studentName,
                    'permissions' => RolePermissionService::permissionsForRole('STU'),
                ]
            );

            $student = TenantContext::withoutScope(fn () => Student::create([
                'school_id' => $schoolId,
                'user_id' => $studentUser->id,
                'admission_number' => $admNo,
                'full_name' => $studentName,
                'email' => $studentEmail,
                'phone' => $app->phone,
                'gender' => in_array($data['gender'] ?? '', ['male', 'female', 'other'], true) ? $data['gender'] : null,
                'date_of_birth' => ! empty($data['date_of_birth']) ? $data['date_of_birth'] : null,
                'status' => 'active',
            ]));

            // 3. Assign Student to SchoolClass for Active AcademicSession
            if ($targetClass && $activeSession) {
                TenantContext::withoutScope(fn () => StudentClassMembership::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'student_id' => $student->id,
                        'academic_session_id' => $activeSession->id,
                    ],
                    [
                        'class_id' => $targetClass->id,
                    ]
                ));
            }

            // 4. Provision Parent/Guardian User + SchoolMembership (PAR) + ParentGuardian + GuardianRelationship
            $guardianName = trim((string) ($data['guardian_name'] ?? '')) ?: ('Parent of ' . $studentName);
            $guardianPhone = trim((string) ($data['guardian_phone'] ?? $app->phone ?? ''));
            $guardianEmail = trim(strtolower((string) ($data['guardian_email'] ?? '')));
            if ($guardianEmail === '' || $guardianEmail === $studentEmail) {
                $slug = preg_replace('/[^a-z0-9]/', '', strtolower($admNo));
                $guardianEmail = "parent.{$slug}@campus.local";
            }

            $parentLoginPin = PinGeneratorService::generate($school, 'PAR', $guardianName);
            $parentUser = User::where('email', $guardianEmail)->first();
            if (! $parentUser) {
                $parentUser = User::create([
                    'email' => $guardianEmail,
                    'password_hash' => Hash::make('12345678'),
                    'full_name' => $guardianName,
                    'phone' => $guardianPhone ?: null,
                    'status' => 'active',
                    'must_change_password' => true,
                    'login_pin' => $parentLoginPin,
                    'platform_pin' => $parentLoginPin,
                    'active_school_id' => $schoolId,
                    'active_role' => 'PAR',
                ]);
            } else {
                $parentLoginPin = $parentUser->login_pin ?: $parentLoginPin;
                $parentUser->update([
                    'login_pin' => $parentLoginPin,
                    'active_school_id' => $parentUser->active_school_id ?: $schoolId,
                    'active_role' => $parentUser->active_role ?: 'PAR',
                ]);
            }

            SchoolMembership::updateOrCreate(
                ['user_id' => $parentUser->id, 'school_id' => $schoolId, 'role' => 'PAR'],
                [
                    'status' => 'active',
                    'is_primary' => true,
                    'login_pin' => $parentLoginPin,
                    'user_pin' => $parentLoginPin,
                    'user_email' => $guardianEmail,
                    'user_name' => $guardianName,
                    'permissions' => RolePermissionService::permissionsForRole('PAR'),
                ]
            );

            $guardian = TenantContext::withoutScope(fn () => ParentGuardian::updateOrCreate(
                ['school_id' => $schoolId, 'user_id' => $parentUser->id],
                [
                    'full_name' => $guardianName,
                    'email' => $guardianEmail,
                    'phone' => $guardianPhone ?: null,
                    'status' => 'active',
                ]
            ));

            TenantContext::withoutScope(fn () => GuardianRelationship::updateOrCreate(
                [
                    'school_id' => $schoolId,
                    'guardian_id' => $guardian->id,
                    'student_id' => $student->id,
                ],
                [
                    'relationship_type' => $data['guardian_relationship'] ?? 'guardian',
                    'is_primary' => true,
                ]
            ));

            // 5. Update Admission Application Record to 'enrolled'
            $updatedData = array_merge($data, [
                'class_id' => $targetClass?->id,
                'enrolled_class_name' => $targetClass?->name ?? ($data['programme'] ?? 'Assigned Class'),
                'admission_number' => $admNo,
                'student_login_pin' => $studentLoginPin,
                'parent_login_pin' => $parentLoginPin,
                'review_notes' => $reviewNotes !== null ? $reviewNotes : ($data['review_notes'] ?? $app->decision_notes),
            ]);

            $app->update([
                'status' => 'enrolled',
                'decision_notes' => $reviewNotes !== null ? $reviewNotes : $app->decision_notes,
                'decision_at' => $app->decision_at ?? now(),
                'reviewed_by' => $reviewedByUserId ?? $app->reviewed_by,
                'provisioned_student_id' => $student->id,
                'provisioned_guardian_id' => $guardian->id,
                'provisioned_at' => now(),
                'application_data' => $updatedData,
            ]);

            return [
                'already_provisioned' => false,
                'application_id' => $app->id,
                'application_number' => $app->public_reference ?: ($data['application_number'] ?? ('APP-' . $app->id)),
                'status' => 'enrolled',
                'student' => [
                    'id' => $student->id,
                    'user_id' => $studentUser->id,
                    'full_name' => $student->full_name,
                    'admission_number' => $admNo,
                    'email' => $studentEmail,
                    'class_id' => $targetClass?->id,
                    'class_name' => $targetClass?->name ?? 'Assigned Class',
                    'login_pin' => $studentLoginPin,
                    'default_password' => '12345678',
                ],
                'parent' => [
                    'id' => $guardian->id,
                    'user_id' => $parentUser->id,
                    'full_name' => $guardian->full_name,
                    'email' => $guardianEmail,
                    'phone' => $guardianPhone,
                    'login_pin' => $parentLoginPin,
                    'default_password' => '12345678',
                ],
                'message' => 'Student & Parent portal accounts provisioned and class assigned successfully!',
            ];
        });

        // 6. Queue Welcome Onboarding Emails asynchronously for both Student & Parent
        try {
            TransactionalEmailService::queueEmail(
                $schoolId,
                'welcome_onboarding',
                $result['student']['email'],
                $result['student']['full_name'],
                [
                    'role' => 'student',
                    'loginEmail' => $result['student']['login_pin'] . ' / ' . $result['student']['email'],
                    'admissionNumber' => $result['student']['admission_number'],
                    'temporaryPassword' => '12345678',
                ]
            );
            TransactionalEmailService::queueEmail(
                $schoolId,
                'welcome_onboarding',
                $result['parent']['email'],
                $result['parent']['full_name'],
                [
                    'role' => 'parent',
                    'loginEmail' => $result['parent']['login_pin'] . ' / ' . $result['parent']['email'],
                    'admissionNumber' => 'Linked Student: ' . $result['student']['full_name'] . ' (' . $result['student']['admission_number'] . ')',
                    'temporaryPassword' => '12345678',
                ]
            );
        } catch (\Throwable $e) {
            // Non-fatal: accounts are already committed atomically
        }

        return $result;
    }

    protected static function generateUniquePin(string $schoolCode, string $roleCode): string
    {
        do {
            $pin = $schoolCode . '-' . $roleCode . '-' . strtoupper(Str::random(6));
        } while (User::where('login_pin', $pin)->exists());

        return $pin;
    }
}
