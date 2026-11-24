<?php

namespace App\Services\Rpc;

use App\Models\AcademicSession;
use App\Models\AuditLog;
use App\Models\GradingScheme;
use App\Models\Result;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentClassMembership;
use App\Models\Teacher;
use App\Models\User;
use App\Services\PinGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BulkOperationsRpcService extends BaseRpcService
{
    /**
     * Bulk CSV import for Students with automatic SS-STU-XXXXXX PIN & User account provisioning.
     */
    public function bulkImportStudents(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $school = School::find($schoolId);
        if (! $school) {
            return response()->json(['error' => 'School not found.'], 404);
        }

        $rows = $request->input('rows', []);
        if (! is_array($rows) || count($rows) === 0) {
            return response()->json(['error' => 'No rows provided for import.'], 422);
        }

        $sessionId = $request->input('academic_session_id')
            ?: AcademicSession::where('school_id', $schoolId)->where('is_active', true)->value('id')
            ?: AcademicSession::where('school_id', $schoolId)->orderByDesc('id')->value('id');

        $classesByName = SchoolClass::where('school_id', $schoolId)
            ->get()
            ->keyBy(fn (SchoolClass $c) => strtolower(trim($c->name)));

        $defaultPassword = '12345678';
        $passwordHash = Hash::make($defaultPassword);

        $created = 0;
        $errors = [];
        $credentials = [];

        foreach ($rows as $idx => $row) {
            $rowNum = $idx + 1;
            $fullName = trim((string) ($row['full_name'] ?? $row['name'] ?? ''));
            if ($fullName === '') {
                $errors[] = ['row' => $rowNum, 'message' => 'Full name is required.'];
                continue;
            }

            $admNo = trim((string) ($row['admission_number'] ?? $row['adm_no'] ?? ''));
            $email = trim(strtolower((string) ($row['email'] ?? '')));
            $phone = trim((string) ($row['phone'] ?? ''));
            $gender = strtolower(trim((string) ($row['gender'] ?? '')));
            if (! in_array($gender, ['male', 'female', 'other'], true)) {
                $gender = null;
            }
            $dob = trim((string) ($row['date_of_birth'] ?? $row['dob'] ?? ''));
            $dob = $dob !== '' && strtotime($dob) !== false ? date('Y-m-d', strtotime($dob)) : null;

            $classNameInput = trim((string) ($row['class_name'] ?? $row['class'] ?? ''));
            $classId = ! empty($row['class_id']) ? (int) $row['class_id'] : null;
            if (! $classId && $classNameInput !== '') {
                $matchedClass = $classesByName->get(strtolower($classNameInput));
                $classId = $matchedClass?->id;
            }

            if ($admNo !== '') {
                $exists = Student::where('school_id', $schoolId)->where('admission_number', $admNo)->exists();
                if ($exists) {
                    $errors[] = ['row' => $rowNum, 'message' => "Admission number '{$admNo}' already exists."];
                    continue;
                }
            }

            try {
                $record = DB::transaction(function () use (
                    $school,
                    $schoolId,
                    $fullName,
                    $admNo,
                    $email,
                    $phone,
                    $gender,
                    $dob,
                    $classId,
                    $sessionId,
                    $passwordHash
                ) {
                    $pin = PinGeneratorService::generate($school, 'STU', $fullName);
                    $finalAdmNo = $admNo !== '' ? $admNo : $pin;

                    $userEmail = $email !== '' ? $email : strtolower($pin) . '@student.iportal.local';
                    if (User::where('email', $userEmail)->exists()) {
                        $userEmail = strtolower($pin) . '.' . random_int(10, 99) . '@student.iportal.local';
                    }

                    $user = User::create([
                        'full_name' => $fullName,
                        'email' => $userEmail,
                        'phone' => $phone !== '' ? $phone : null,
                        'password_hash' => $passwordHash,
                        'login_pin' => $pin,
                        'platform_pin' => $pin,
                        'active_school_id' => $schoolId,
                        'active_role' => 'STU',
                        'status' => 'active',
                        'must_change_password' => 1,
                    ]);

                    SchoolMembership::create([
                        'school_id' => $schoolId,
                        'user_id' => $user->id,
                        'role' => 'STU',
                        'status' => 'active',
                        'is_primary' => true,
                        'login_pin' => $pin,
                        'user_pin' => $pin,
                        'user_name' => $fullName,
                        'user_email' => $userEmail,
                    ]);

                    $student = Student::create([
                        'school_id' => $schoolId,
                        'user_id' => $user->id,
                        'full_name' => $fullName,
                        'admission_number' => $finalAdmNo,
                        'gender' => $gender,
                        'date_of_birth' => $dob,
                        'email' => $email !== '' ? $email : null,
                        'phone' => $phone !== '' ? $phone : null,
                        'status' => 'active',
                    ]);

                    if ($classId && $sessionId) {
                        StudentClassMembership::create([
                            'school_id' => $schoolId,
                            'student_id' => $student->id,
                            'class_id' => $classId,
                            'academic_session_id' => $sessionId,
                        ]);
                    }

                    return [
                        'student_id' => $student->id,
                        'full_name' => $fullName,
                        'admission_number' => $finalAdmNo,
                        'login_pin' => $pin,
                    ];
                });

                $created++;
                $credentials[] = array_merge($record, [
                    'class_name' => $classNameInput,
                    'default_password' => $defaultPassword,
                ]);
            } catch (\Throwable $e) {
                $errors[] = ['row' => $rowNum, 'message' => $e->getMessage()];
            }
        }

        if ($created > 0) {
            AuditLog::create([
                'school_id' => $schoolId,
                'actor_user_id' => $request->user()?->id,
                'event_type' => 'bulk_import_students',
                'entity_type' => 'Student',
                'entity_id' => 0,
                'new_values' => [
                    'created' => $created,
                    'errors_count' => count($errors),
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'created' => $created,
                'failed' => count($errors),
                'errors' => $errors,
                'credentials' => $credentials,
            ],
        ]);
    }

    /**
     * Bulk CSV import for Teachers with automatic SS-TEA-XXXXXX PIN & User account provisioning.
     */
    public function bulkImportTeachers(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $school = School::find($schoolId);
        if (! $school) {
            return response()->json(['error' => 'School not found.'], 404);
        }

        $rows = $request->input('rows', []);
        if (! is_array($rows) || count($rows) === 0) {
            return response()->json(['error' => 'No rows provided for import.'], 422);
        }

        $defaultPassword = '12345678';
        $passwordHash = Hash::make($defaultPassword);

        $created = 0;
        $errors = [];
        $credentials = [];

        foreach ($rows as $idx => $row) {
            $rowNum = $idx + 1;
            $fullName = trim((string) ($row['full_name'] ?? $row['name'] ?? ''));
            if ($fullName === '') {
                $errors[] = ['row' => $rowNum, 'message' => 'Full name is required.'];
                continue;
            }

            $email = trim(strtolower((string) ($row['email'] ?? '')));
            $phone = trim((string) ($row['phone'] ?? ''));

            try {
                $record = DB::transaction(function () use ($school, $schoolId, $fullName, $email, $phone, $passwordHash) {
                    $pin = PinGeneratorService::generate($school, 'TEA', $fullName);
                    $userEmail = $email !== '' ? $email : strtolower($pin) . '@staff.iportal.local';

                    $user = User::where('email', $userEmail)->first();
                    if (! $user) {
                        $user = User::create([
                            'full_name' => $fullName,
                            'email' => $userEmail,
                            'phone' => $phone !== '' ? $phone : null,
                            'password_hash' => $passwordHash,
                            'login_pin' => $pin,
                            'platform_pin' => $pin,
                            'active_school_id' => $schoolId,
                            'active_role' => 'TEA',
                            'status' => 'active',
                            'must_change_password' => 1,
                        ]);
                    } else {
                        $pin = $user->login_pin ?: $pin;
                    }

                    SchoolMembership::updateOrCreate(
                        ['school_id' => $schoolId, 'user_id' => $user->id],
                        [
                            'role' => 'TEA',
                            'status' => 'active',
                            'is_primary' => true,
                            'login_pin' => $pin,
                            'user_pin' => $pin,
                            'user_name' => $fullName,
                            'user_email' => $user->email,
                        ]
                    );

                    $teacher = Teacher::create([
                        'school_id' => $schoolId,
                        'user_id' => $user->id,
                        'full_name' => $fullName,
                        'staff_number' => $pin,
                        'email' => $email !== '' ? $email : null,
                        'phone' => $phone !== '' ? $phone : null,
                        'status' => 'active',
                    ]);

                    return [
                        'teacher_id' => $teacher->id,
                        'full_name' => $fullName,
                        'staff_number' => $pin,
                        'login_pin' => $pin,
                    ];
                });

                $created++;
                $credentials[] = array_merge($record, [
                    'default_password' => $defaultPassword,
                ]);
            } catch (\Throwable $e) {
                $errors[] = ['row' => $rowNum, 'message' => $e->getMessage()];
            }
        }

        if ($created > 0) {
            AuditLog::create([
                'school_id' => $schoolId,
                'actor_user_id' => $request->user()?->id,
                'event_type' => 'bulk_import_teachers',
                'entity_type' => 'Teacher',
                'entity_id' => 0,
                'new_values' => [
                    'created' => $created,
                    'errors_count' => count($errors),
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'created' => $created,
                'failed' => count($errors),
                'errors' => $errors,
                'credentials' => $credentials,
            ],
        ]);
    }

    /**
     * Bulk CSV import for Student Scores into a specific Session + Term + Class + Subject.
     */
    public function bulkImportScores(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $sessionId = (int) $request->input('academic_session_id');
        $termId = (int) $request->input('term_id');
        $classId = (int) $request->input('class_id');
        $subjectId = (int) $request->input('subject_id');
        $rows = $request->input('rows', []);

        if (! $sessionId || ! $termId || ! $classId || ! $subjectId) {
            return response()->json(['error' => 'Session, Term, Class, and Subject are required.'], 422);
        }
        if (! is_array($rows) || count($rows) === 0) {
            return response()->json(['error' => 'No score rows provided.'], 422);
        }

        $scheme = GradingScheme::where('school_id', $schoolId)
            ->orderByDesc('is_default')
            ->first();

        $students = Student::with('user')->where('school_id', $schoolId)->get();
        $byAdm = [];
        $byPin = [];
        $byName = [];
        foreach ($students as $st) {
            if ($st->admission_number) {
                $byAdm[strtolower(trim($st->admission_number))] = $st;
            }
            if ($st->user?->login_pin) {
                $byPin[strtolower(trim($st->user->login_pin))] = $st;
            }
            if ($st->full_name) {
                $byName[strtolower(trim($st->full_name))] = $st;
            }
        }

        $imported = 0;
        $errors = [];

        foreach ($rows as $idx => $row) {
            $rowNum = $idx + 1;
            $adm = strtolower(trim((string) ($row['admission_number'] ?? $row['adm_no'] ?? '')));
            $pin = strtolower(trim((string) ($row['login_pin'] ?? $row['pin'] ?? '')));
            $name = strtolower(trim((string) ($row['full_name'] ?? $row['student_name'] ?? '')));

            $student = ($adm !== '' ? ($byAdm[$adm] ?? null) : null)
                ?? ($pin !== '' ? ($byPin[$pin] ?? null) : null)
                ?? ($name !== '' ? ($byName[$name] ?? null) : null);

            if (! $student) {
                $label = $adm ?: ($pin ?: ($name ?: "Row #{$rowNum}"));
                $errors[] = ['row' => $rowNum, 'message' => "Student '{$label}' not found in this school."];
                continue;
            }

            $ca1 = isset($row['ca1']) && $row['ca1'] !== '' ? (float) $row['ca1'] : (isset($row['ca_1']) && $row['ca_1'] !== '' ? (float) $row['ca_1'] : 0.0);
            $ca2 = isset($row['ca2']) && $row['ca2'] !== '' ? (float) $row['ca2'] : (isset($row['ca_2']) && $row['ca_2'] !== '' ? (float) $row['ca_2'] : 0.0);
            $exam = isset($row['exam']) && $row['exam'] !== '' ? (float) $row['exam'] : 0.0;

            if ($ca1 < 0 || $ca2 < 0 || $exam < 0 || ($ca1 + $ca2 + $exam) > 100) {
                $errors[] = ['row' => $rowNum, 'message' => "Invalid scores for {$student->full_name} (total cannot exceed 100)."];
                continue;
            }

            $total = round($ca1 + $ca2 + $exam, 2);
            [$grade, $remark] = $this->resolveGrade($total, $scheme);

            Result::updateOrCreate(
                [
                    'school_id' => $schoolId,
                    'student_id' => $student->id,
                    'academic_session_id' => $sessionId,
                    'term_id' => $termId,
                    'class_id' => $classId,
                    'subject_id' => $subjectId,
                ],
                [
                    'grading_scheme_id' => $scheme?->id,
                    'components' => [
                        'ca1' => $ca1,
                        'ca2' => $ca2,
                        'exam' => $exam,
                    ],
                    'total_score' => $total,
                    'grade' => $grade,
                    'remark' => $remark,
                    'status' => 'draft',
                ]
            );
            $imported++;
        }

        return response()->json([
            'data' => [
                'created' => $imported,
                'failed' => count($errors),
                'errors' => $errors,
            ],
        ]);
    }

    /**
     * End-of-Session Class Promotion Wizard RPC.
     * Supports promoting students to next class, holding back (repeat), or graduating.
     */
    public function promoteStudents(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $sourceSessionId = (int) $request->input('source_session_id');
        $targetSessionId = (int) $request->input('target_session_id');
        $promotions = $request->input('promotions', []);

        if (! $targetSessionId) {
            return response()->json(['error' => 'Target academic session is required.'], 422);
        }
        if (! is_array($promotions) || count($promotions) === 0) {
            return response()->json(['error' => 'No student promotion decisions provided.'], 422);
        }

        $promoted = 0;
        $repeated = 0;
        $graduated = 0;

        DB::transaction(function () use ($schoolId, $targetSessionId, $promotions, &$promoted, &$repeated, &$graduated) {
            foreach ($promotions as $item) {
                $studentId = (int) ($item['student_id'] ?? 0);
                $action = strtolower((string) ($item['action'] ?? 'promote'));
                $fromClassId = ! empty($item['from_class_id']) ? (int) $item['from_class_id'] : null;
                $toClassId = ! empty($item['to_class_id']) ? (int) $item['to_class_id'] : null;

                if (! $studentId) {
                    continue;
                }

                $student = Student::where('school_id', $schoolId)->find($studentId);
                if (! $student) {
                    continue;
                }

                if ($action === 'graduate') {
                    $student->update(['status' => 'graduated']);
                    $graduated++;
                    continue;
                }

                $destClassId = $action === 'repeat' ? ($fromClassId ?: $toClassId) : $toClassId;
                if (! $destClassId) {
                    continue;
                }

                StudentClassMembership::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'student_id' => $student->id,
                        'academic_session_id' => $targetSessionId,
                    ],
                    [
                        'class_id' => $destClassId,
                    ]
                );

                if ($action === 'repeat') {
                    $repeated++;
                } else {
                    $promoted++;
                }
            }
        });

        AuditLog::create([
            'school_id' => $schoolId,
            'actor_user_id' => $request->user()?->id,
            'event_type' => 'students_promoted',
            'entity_type' => 'AcademicSession',
            'entity_id' => $targetSessionId,
            'new_values' => [
                'source_session_id' => $sourceSessionId,
                'target_session_id' => $targetSessionId,
                'promoted' => $promoted,
                'repeated' => $repeated,
                'graduated' => $graduated,
            ],
        ]);

        return response()->json([
            'data' => [
                'success' => true,
                'promoted' => $promoted,
                'repeated' => $repeated,
                'graduated' => $graduated,
                'message' => "Promotion complete: {$promoted} promoted, {$repeated} held back, {$graduated} graduated.",
            ],
        ]);
    }

    private function resolveGrade(float $score, ?GradingScheme $scheme): array
    {
        $bands = is_array($scheme?->grade_bands) ? $scheme->grade_bands : [];
        foreach ($bands as $band) {
            $min = (float) ($band['min'] ?? $band['min_score'] ?? 0);
            $max = (float) ($band['max'] ?? $band['max_score'] ?? 100);
            if ($score >= $min && $score <= $max) {
                return [
                    (string) ($band['grade'] ?? 'C'),
                    (string) ($band['remark'] ?? 'Pass'),
                ];
            }
        }

        if ($score >= 70) return ['A', 'Excellent'];
        if ($score >= 60) return ['B', 'Very Good'];
        if ($score >= 50) return ['C', 'Good'];
        if ($score >= 45) return ['D', 'Fair'];
        if ($score >= 40) return ['E', 'Pass'];
        return ['F', 'Fail'];
    }
}
