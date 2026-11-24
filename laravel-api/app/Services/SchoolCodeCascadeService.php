<?php

namespace App\Services;

use App\Models\AdmissionApplication;
use App\Models\AuditLog;
use App\Models\Receipt;
use App\Models\School;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Propagates a school short code (SS) change everywhere it is connected:
 *  - School memberships (login_pin, user_pin)
 *  - Linked user accounts (login_pin, platform_pin)
 *  - Teachers (staff_number synced with login_pin)
 *  - Students (admission_number prefix)
 *  - Receipts (receipt_number prefix)
 *  - Admission applications (public_reference & application_data.application_number)
 */
class SchoolCodeCascadeService
{
    public static function propagate(School $school, string $oldCode, string $newCode, ?User $actor = null): array
    {
        $oldClean = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', trim($oldCode)) ?? '');
        $newClean = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', trim($newCode)) ?? '');

        $summary = [
            'old_code' => $oldClean,
            'new_code' => $newClean,
            'memberships_updated' => 0,
            'users_updated' => 0,
            'teachers_updated' => 0,
            'students_updated' => 0,
            'receipts_updated' => 0,
            'applications_updated' => 0,
        ];

        if ($newClean === '' || $oldClean === $newClean) {
            return $summary;
        }

        DB::transaction(function () use ($school, $oldClean, $newClean, $actor, &$summary) {
            $schoolId = $school->id;
            $userPinMap = [];

            // 1. Update SchoolMemberships & collect user PIN mappings
            $memberships = SchoolMembership::where('school_id', $schoolId)->get();
            foreach ($memberships as $m) {
                if (strtoupper((string) $m->role) === 'SAD') {
                    continue;
                }
                $currentPin = $m->login_pin ?: $m->user_pin;
                if (! $currentPin) {
                    continue;
                }
                $rewritten = PinGeneratorService::rewriteForSchoolCode($currentPin, $oldClean, $newClean);
                if ($rewritten && $rewritten !== $currentPin) {
                    $m->update([
                        'login_pin' => $rewritten,
                        'user_pin' => $rewritten,
                    ]);
                    $summary['memberships_updated']++;
                    if ($m->user_id) {
                        $userPinMap[$m->user_id] = $rewritten;
                    }
                }
            }

            // 2. Update Users linked to those memberships or active in this school
            $userIds = array_unique(array_merge(
                array_keys($userPinMap),
                User::where('active_school_id', $schoolId)->pluck('id')->all()
            ));

            if (! empty($userIds)) {
                $users = User::whereIn('id', $userIds)->get();
                foreach ($users as $u) {
                    if ($u->is_super_admin) {
                        continue;
                    }
                    $newPin = $userPinMap[$u->id]
                        ?? PinGeneratorService::rewriteForSchoolCode($u->login_pin ?: $u->platform_pin, $oldClean, $newClean);
                    if ($newPin && ($u->login_pin !== $newPin || $u->platform_pin !== $newPin)) {
                        $u->update([
                            'login_pin' => $newPin,
                            'platform_pin' => $newPin,
                        ]);
                        $summary['users_updated']++;
                        $userPinMap[$u->id] = $newPin;
                    }
                }
            }

            // 3. Update Teachers (staff_number synced to new PIN / school prefix)
            $teachers = Teacher::where('school_id', $schoolId)->get();
            foreach ($teachers as $t) {
                $newStaffNumber = null;
                if ($t->user_id && isset($userPinMap[$t->user_id])) {
                    $newStaffNumber = $userPinMap[$t->user_id];
                } elseif (! empty($t->staff_number)) {
                    $candidate = PinGeneratorService::rewriteForSchoolCode($t->staff_number, $oldClean, $newClean);
                    if ($candidate && $candidate !== $t->staff_number) {
                        $newStaffNumber = $candidate;
                    }
                }

                if ($newStaffNumber && $newStaffNumber !== $t->staff_number) {
                    $t->update(['staff_number' => $newStaffNumber]);
                    $summary['teachers_updated']++;
                }
            }

            // 4. Update Students admission_number if prefixed with OLD/ or OLD-
            if ($oldClean !== '') {
                $students = Student::where('school_id', $schoolId)->get();
                foreach ($students as $s) {
                    $adm = (string) ($s->admission_number ?? '');
                    if ($adm === '') {
                        continue;
                    }
                    $updatedAdm = null;
                    if (stripos($adm, $oldClean . '/') === 0) {
                        $updatedAdm = $newClean . '/' . substr($adm, strlen($oldClean) + 1);
                    } elseif (stripos($adm, $oldClean . '-') === 0) {
                        $updatedAdm = $newClean . '-' . substr($adm, strlen($oldClean) + 1);
                    }
                    if ($updatedAdm && $updatedAdm !== $adm) {
                        $s->update(['admission_number' => $updatedAdm]);
                        $summary['students_updated']++;
                    }
                }

                // 5. Update Receipts receipt_number if prefixed with RCP-OLD- or OLD-
                $receipts = Receipt::where('school_id', $schoolId)->get();
                foreach ($receipts as $r) {
                    $num = (string) ($r->receipt_number ?? '');
                    if ($num === '') {
                        continue;
                    }
                    $updatedNum = null;
                    if (stripos($num, 'RCP-' . $oldClean . '-') === 0) {
                        $updatedNum = 'RCP-' . $newClean . '-' . substr($num, strlen('RCP-' . $oldClean . '-'));
                    } elseif (stripos($num, $oldClean . '-') === 0) {
                        $updatedNum = $newClean . '-' . substr($num, strlen($oldClean) + 1);
                    }
                    if ($updatedNum && $updatedNum !== $num) {
                        $r->update(['receipt_number' => $updatedNum]);
                        $summary['receipts_updated']++;
                    }
                }

                // 6. Update AdmissionApplications public_reference & application_data.application_number
                $apps = AdmissionApplication::where('school_id', $schoolId)->get();
                foreach ($apps as $app) {
                    $ref = (string) ($app->public_reference ?? '');
                    $updatedRef = null;
                    if (stripos($ref, 'APP/' . $oldClean . '/') === 0) {
                        $updatedRef = 'APP/' . $newClean . '/' . substr($ref, strlen('APP/' . $oldClean . '/'));
                    } elseif (stripos($ref, 'APP-' . $oldClean . '-') === 0) {
                        $updatedRef = 'APP-' . $newClean . '-' . substr($ref, strlen('APP-' . $oldClean . '-'));
                    }
                    if ($updatedRef && $updatedRef !== $ref) {
                        $data = is_array($app->application_data) ? $app->application_data : [];
                        $data['application_number'] = $updatedRef;
                        $app->update([
                            'public_reference' => $updatedRef,
                            'application_data' => $data,
                        ]);
                        $summary['applications_updated']++;
                    }
                }
            }

            // 7. Record immutable AuditLog
            AuditLog::create([
                'school_id' => $schoolId,
                'actor_user_id' => $actor?->id,
                'event_type' => 'school_code_updated',
                'entity_type' => 'School',
                'entity_id' => $schoolId,
                'old_values' => ['school_code' => $oldClean],
                'new_values' => array_merge($summary, [
                    'description' => "School code changed from {$oldClean} to {$newClean} (propagated to {$summary['users_updated']} users, {$summary['teachers_updated']} teachers, {$summary['students_updated']} students, {$summary['applications_updated']} applications).",
                ]),
            ]);
        });

        return $summary;
    }
}
