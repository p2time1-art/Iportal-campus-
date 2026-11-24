<?php

namespace Database\Seeders;

use App\Models\AcademicSession;
use App\Models\GuardianRelationship;
use App\Models\ParentGuardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentClassMembership;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DevelopmentDataSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local') || ! filter_var(env('IPORTAL_SEED_DEVELOPMENT_DATA', false), FILTER_VALIDATE_BOOLEAN)) {
            throw new \LogicException('Set APP_ENV=local and IPORTAL_SEED_DEVELOPMENT_DATA=true to seed development data.');
        }

        $school = School::firstOrCreate(
            ['code' => 'DEV-CAMPUS'],
            [
                'name' => 'iPortal Development Campus',
                'short_name' => 'Demo Campus',
                'status' => 'active',
                'subscription_status' => 'trial',
                'timezone' => 'UTC',
            ]
        );

        $this->user('sad@example.test', 'Platform Development Admin', [
            'platform_pin' => 'PL-SAD-AA0001',
            'active_role' => 'SAD',
            'is_super_admin' => true,
        ]);

        $this->user('test@mail.com', 'Super Admin', [
            'platform_pin' => 'PL-SAD-TG27BI',
            'login_pin' => 'PL-SAD-TG27BI',
        ]);

        $admin = $this->user('admin@example.test', 'Development School Admin', [
            'login_pin' => 'DC-ADM-AA0001',
            'active_school_id' => $school->id,
            'active_role' => 'ADM',
            'is_school_admin' => true,
        ]);
        $teacherUser = $this->user('teacher@example.test', 'Development Teacher', [
            'login_pin' => 'DC-TEA-TT0002',
            'active_school_id' => $school->id,
            'active_role' => 'TEA',
        ]);
        $studentUser = $this->user('student@example.test', 'Development Student', [
            'login_pin' => 'DC-STU-SS0003',
            'active_school_id' => $school->id,
            'active_role' => 'STU',
        ]);
        $parentUser = $this->user('parent@example.test', 'Development Parent', [
            'login_pin' => 'DC-PAR-PP0004',
            'active_school_id' => $school->id,
            'active_role' => 'PAR',
        ]);

        foreach ([
            [$admin, 'ADM'],
            [$teacherUser, 'TEA'],
            [$studentUser, 'STU'],
            [$parentUser, 'PAR'],
        ] as [$user, $role]) {
            SchoolMembership::firstOrCreate(
                ['user_id' => $user->id, 'school_id' => $school->id, 'role' => $role],
                [
                    'status' => 'active',
                    'is_primary' => true,
                    'login_pin' => $user->login_pin,
                    'user_email' => $user->email,
                    'user_name' => $user->full_name,
                ]
            );
        }

        $teacher = Teacher::firstOrCreate(
            ['school_id' => $school->id, 'staff_number' => 'DEV-TEA-001'],
            [
                'user_id' => $teacherUser->id,
                'full_name' => $teacherUser->full_name,
                'email' => $teacherUser->email,
                'status' => 'active',
            ]
        );
        $student = Student::firstOrCreate(
            ['school_id' => $school->id, 'admission_number' => 'DEV-STU-001'],
            [
                'user_id' => $studentUser->id,
                'full_name' => $studentUser->full_name,
                'email' => $studentUser->email,
                'status' => 'active',
            ]
        );
        $guardian = ParentGuardian::firstOrCreate(
            ['school_id' => $school->id, 'user_id' => $parentUser->id],
            [
                'full_name' => $parentUser->full_name,
                'email' => $parentUser->email,
                'status' => 'active',
            ]
        );

        $session = AcademicSession::firstOrCreate(
            ['school_id' => $school->id, 'name' => '2026/2027 Development Session'],
            ['start_date' => '2026-09-01', 'end_date' => '2027-07-31', 'status' => 'active']
        );
        Term::firstOrCreate(
            ['school_id' => $school->id, 'academic_session_id' => $session->id, 'name' => 'Development Term 1'],
            ['start_date' => '2026-09-01', 'end_date' => '2026-12-18', 'status' => 'active']
        );
        $class = SchoolClass::firstOrCreate(
            ['school_id' => $school->id, 'academic_session_id' => $session->id, 'name' => 'Development Year 1'],
            ['code' => 'DEV-Y1', 'level' => 'Year 1', 'arm' => 'A']
        );
        $subject = Subject::firstOrCreate(
            ['school_id' => $school->id, 'name' => 'Development Mathematics'],
            ['code' => 'DEV-MATH', 'description' => 'Local development fixture']
        );

        TeacherAssignment::firstOrCreate([
            'teacher_id' => $teacher->id,
            'subject_id' => $subject->id,
            'class_id' => $class->id,
            'academic_session_id' => $session->id,
        ], ['school_id' => $school->id]);

        StudentClassMembership::firstOrCreate([
            'student_id' => $student->id,
            'class_id' => $class->id,
            'academic_session_id' => $session->id,
        ], ['school_id' => $school->id]);

        GuardianRelationship::firstOrCreate(
            ['school_id' => $school->id, 'guardian_id' => $guardian->id, 'student_id' => $student->id],
            ['relationship_type' => 'parent', 'is_primary' => true]
        );

        $this->command?->info('Local development school and role fixtures were seeded without displaying credentials.');
    }

    private function user(string $email, string $fullName, array $attributes): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'full_name' => $fullName,
                'status' => 'active',
                ...$attributes,
            ]
        );

        if (! $user->password_hash) {
            $user->password_hash = Hash::make('12345678');
            $user->save();
        }

        return $user;
    }
}
