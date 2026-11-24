<?php

namespace Tests\Feature;

use App\Models\GuardianRelationship;
use App\Models\ParentGuardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentClassMembership;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Services\AuthorizationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthAndAuthorizationTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
    }

    public function test_valid_login_me_and_logout_work(): void
    {
        $school = School::query()->firstOrCreate([
            'code' => 'AUTH-SCHOOL',
        ], [
            'name' => 'Auth School',
            'short_name' => 'AUTH',
            'status' => 'active',
            'subscription_status' => 'trial',
        ]);

        $user = User::query()->create([
            'email' => 'auth.user@example.test',
            'password_hash' => Hash::make('Password123!'),
            'full_name' => 'Auth User',
            'status' => 'active',
            'must_change_password' => true,
            'login_pin' => 'AB-ADM-123456',
            'active_school_id' => $school->id,
            'active_role' => 'ADM',
            'is_school_admin' => true,
        ]);

        SchoolMembership::query()->create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'role' => 'ADM',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $csrf = $this->getJson('/api/auth/csrf')->assertOk()->json('csrf_token');
        $login = $this->withUnencryptedCookie('XSRF-TOKEN', $csrf)
            ->withHeader('X-CSRF-TOKEN', $csrf)
            ->postJson('/api/auth/login', [
            'pin' => 'AB-ADM-123456',
            'password' => 'Password123!',
        ]);

        $login->assertOk()
            ->assertJsonPath('user.pin', 'AB-ADM-123456')
            ->assertJsonPath('requires_password_change', true)
            ->assertJsonMissingPath('token')
            ->assertJsonMissingPath('user.password_hash');

        $sessionCookie = $login->getCookie('iportal_session', false);
        $this->assertNotNull($sessionCookie);
        $this->assertTrue($sessionCookie->isHttpOnly());
        $sessionToken = $sessionCookie->getValue();

        $this->withUnencryptedCookie('iportal_session', $sessionToken)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'ADM');

        $this->withUnencryptedCookie('iportal_session', $sessionToken)
            ->withUnencryptedCookie('XSRF-TOKEN', $csrf)
            ->withHeader('X-CSRF-TOKEN', $csrf)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->withUnencryptedCookie('iportal_session', $sessionToken)
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }

    public function test_invalid_pin_or_password_returns_401(): void
    {
        $school = School::query()->firstOrCreate([
            'code' => 'AUTH-SCHOOL-2',
        ], [
            'name' => 'Auth School 2',
            'short_name' => 'AUTH2',
            'status' => 'active',
            'subscription_status' => 'trial',
        ]);

        $user = User::query()->create([
            'email' => 'bad.password@example.test',
            'password_hash' => Hash::make('CorrectPass1!'),
            'full_name' => 'Bad Password User',
            'status' => 'active',
            'login_pin' => 'AB-TEA-654321',
            'active_school_id' => $school->id,
            'active_role' => 'TEA',
        ]);

        SchoolMembership::query()->create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'role' => 'TEA',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $csrf = $this->getJson('/api/auth/csrf')->assertOk()->json('csrf_token');
        $this->withUnencryptedCookie('XSRF-TOKEN', $csrf)
            ->withHeader('X-CSRF-TOKEN', $csrf)
            ->postJson('/api/auth/login', [
            'pin' => 'AB-TEA-654321',
            'password' => 'WrongPassword!',
        ])->assertStatus(401);
    }

    public function test_password_change_requires_current_password_and_updates_password_safely(): void
    {
        $school = School::query()->firstOrCreate([
            'code' => 'PASSWORD-SCHOOL',
        ], [
            'name' => 'Password School',
            'short_name' => 'PASS',
            'status' => 'active',
            'subscription_status' => 'trial',
        ]);

        $user = User::query()->create([
            'email' => 'password.change@example.test',
            'password_hash' => Hash::make('CurrentPass123!'),
            'full_name' => 'Password Change User',
            'status' => 'active',
            'login_pin' => 'AB-ADM-345678',
            'active_school_id' => $school->id,
            'active_role' => 'ADM',
        ]);

        SchoolMembership::query()->create([
            'user_id' => $user->id,
            'school_id' => $school->id,
            'role' => 'ADM',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $sessionToken = 'password-change-session';
        $user->sessions()->create([
            'token_hash' => hash('sha256', $sessionToken),
            'expires_at' => now()->addDay(),
        ]);
        $csrf = $this->getJson('/api/auth/csrf')->assertOk()->json('csrf_token');

        $this->withUnencryptedCookie('iportal_session', $sessionToken)
            ->withUnencryptedCookie('XSRF-TOKEN', $csrf)
            ->withHeader('X-CSRF-TOKEN', $csrf)
            ->postJson('/api/auth/change-password', [
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])
            ->assertStatus(422);

        $this->withUnencryptedCookie('iportal_session', $sessionToken)
            ->withUnencryptedCookie('XSRF-TOKEN', $csrf)
            ->withHeader('X-CSRF-TOKEN', $csrf)
            ->postJson('/api/auth/change-password', [
                'current_password' => 'CurrentPass123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])
            ->assertOk()
            ->assertJsonMissingPath('user.password_hash');

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password_hash));
    }

    public function test_role_middleware_requires_correct_role(): void
    {
        $school = School::query()->firstOrCreate([
            'code' => 'ROLE-SCHOOL',
        ], [
            'name' => 'Role School',
            'short_name' => 'ROLE',
            'status' => 'active',
            'subscription_status' => 'trial',
        ]);

        $user = User::query()->create([
            'email' => 'role.user@example.test',
            'password_hash' => Hash::make('StrongPass456!'),
            'full_name' => 'Role User',
            'status' => 'active',
            'login_pin' => 'AB-SAD-000001',
            'platform_pin' => 'PL-SAD-000001',
            'active_role' => 'SAD',
            'is_super_admin' => true,
        ]);

        $token = $user->sessions()->create([
            'token_hash' => hash('sha256', 'role-token-123'),
            'login_ip' => '127.0.0.1',
            'user_agent' => 'testing',
            'expires_at' => now()->addDay(),
        ])->token_hash;

        Route::middleware(['auth.token', 'role:SAD'])->get('/__role_test', fn () => response()->json(['ok' => true]));

        $this->withHeader('Authorization', 'Bearer '. 'role-token-123')
            ->getJson('/__role_test')
            ->assertOk();
    }

    public function test_authorization_service_blocks_cross_school_and_enforces_teacher_assignment_access(): void
    {
        $service = app(AuthorizationService::class);

        $schoolA = School::query()->firstOrCreate(['code' => 'A-CLASS'], ['name' => 'School A', 'status' => 'active', 'subscription_status' => 'trial']);
        $schoolB = School::query()->firstOrCreate(['code' => 'B-CLASS'], ['name' => 'School B', 'status' => 'active', 'subscription_status' => 'trial']);

        $teacherUser = User::query()->create([
            'email' => 'teacher.authorized@example.test',
            'password_hash' => Hash::make('StrongPass456!'),
            'full_name' => 'Authorized Teacher',
            'status' => 'active',
            'login_pin' => 'AB-TEA-AAAAAA',
            'active_role' => 'TEA',
            'active_school_id' => $schoolA->id,
        ]);

        $otherTeacherUser = User::query()->create([
            'email' => 'teacher.other@example.test',
            'password_hash' => Hash::make('StrongPass456!'),
            'full_name' => 'Other Teacher',
            'status' => 'active',
            'login_pin' => 'AB-TEA-BBBBBB',
            'active_role' => 'TEA',
            'active_school_id' => $schoolB->id,
        ]);

        SchoolMembership::query()->create(['user_id' => $teacherUser->id, 'school_id' => $schoolA->id, 'role' => 'TEA', 'status' => 'active', 'is_primary' => true]);
        SchoolMembership::query()->create(['user_id' => $otherTeacherUser->id, 'school_id' => $schoolB->id, 'role' => 'TEA', 'status' => 'active', 'is_primary' => true]);

        $teacher = Teacher::query()->create([
            'school_id' => $schoolA->id,
            'user_id' => $teacherUser->id,
            'full_name' => $teacherUser->full_name,
            'email' => $teacherUser->email,
            'status' => 'active',
        ]);

        $studentUser = User::query()->create([
            'email' => 'student.test@example.test',
            'password_hash' => Hash::make('StrongPass456!'),
            'full_name' => 'Test Student',
            'status' => 'active',
            'login_pin' => 'AB-STU-CCCCCC',
            'active_role' => 'STU',
            'active_school_id' => $schoolA->id,
        ]);

        $student = Student::query()->create([
            'school_id' => $schoolA->id,
            'user_id' => $studentUser->id,
            'full_name' => $studentUser->full_name,
            'email' => $studentUser->email,
            'status' => 'active',
        ]);

        $session = \App\Models\AcademicSession::query()->create([
            'school_id' => $schoolA->id,
            'name' => 'Auth Session 2026',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'status' => 'active',
        ]);

        $subject = \App\Models\Subject::query()->create([
            'school_id' => $schoolA->id,
            'name' => 'Mathematics',
            'code' => 'MATH',
            'description' => 'Test subject',
        ]);

        $class = SchoolClass::query()->create([
            'school_id' => $schoolA->id,
            'academic_session_id' => $session->id,
            'name' => 'Class A',
            'level' => 'Year 1',
            'code' => 'CLA-1',
            'arm' => 'A',
        ]);

        StudentClassMembership::query()->create([
            'student_id' => $student->id,
            'class_id' => $class->id,
            'school_id' => $schoolA->id,
            'academic_session_id' => $session->id,
        ]);

        TeacherAssignment::query()->create([
            'teacher_id' => $teacher->id,
            'school_id' => $schoolA->id,
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'academic_session_id' => $session->id,
        ]);

        $teacherUser->active_role = 'TEA';
        $teacherUser->active_school_id = $schoolA->id;
        $service->canAccessStudent($teacherUser, $student);

        $this->assertTrue($service->canAccessStudent($teacherUser, $student));
        $this->assertFalse($service->canAccessStudent($otherTeacherUser, $student));
        $this->assertFalse($service->canAccessStudent($teacherUser, Student::query()->create([
            'school_id' => $schoolB->id,
            'full_name' => 'Foreign Student',
            'email' => 'foreign.student@example.test',
            'status' => 'active',
        ])));
    }

    public function test_parent_child_access_is_restricted_to_linked_students(): void
    {
        $service = app(AuthorizationService::class);

        $school = School::query()->firstOrCreate(['code' => 'PARENT-SCHOOL'], ['name' => 'Parent School', 'status' => 'active', 'subscription_status' => 'trial']);

        $parentUser = User::query()->create([
            'email' => 'parent.only@example.test',
            'password_hash' => Hash::make('ParentPass1!'),
            'full_name' => 'Parent User',
            'status' => 'active',
            'login_pin' => 'AB-PAR-ABCDEF',
            'active_role' => 'PAR',
            'active_school_id' => $school->id,
        ]);

        $otherParent = User::query()->create([
            'email' => 'other.parent@example.test',
            'password_hash' => Hash::make('OtherPass1!'),
            'full_name' => 'Other Parent',
            'status' => 'active',
            'login_pin' => 'AB-PAR-123456',
            'active_role' => 'PAR',
            'active_school_id' => $school->id,
        ]);

        SchoolMembership::query()->create([
            'user_id' => $parentUser->id,
            'school_id' => $school->id,
            'role' => 'PAR',
            'status' => 'active',
            'is_primary' => true,
        ]);
        SchoolMembership::query()->create([
            'user_id' => $otherParent->id,
            'school_id' => $school->id,
            'role' => 'PAR',
            'status' => 'active',
            'is_primary' => true,
        ]);

        $guardian = ParentGuardian::query()->create([
            'school_id' => $school->id,
            'user_id' => $parentUser->id,
            'full_name' => $parentUser->full_name,
            'email' => $parentUser->email,
            'status' => 'active',
        ]);

        $studentUser = User::query()->create([
            'email' => 'student.parent@example.test',
            'password_hash' => Hash::make('StudentPass1!'),
            'full_name' => 'Student Parent Child',
            'status' => 'active',
            'login_pin' => 'AB-STU-XYZ123',
            'active_role' => 'STU',
            'active_school_id' => $school->id,
        ]);

        $student = Student::query()->create([
            'school_id' => $school->id,
            'user_id' => $studentUser->id,
            'full_name' => $studentUser->full_name,
            'email' => $studentUser->email,
            'status' => 'active',
        ]);

        GuardianRelationship::query()->create([
            'school_id' => $school->id,
            'guardian_id' => $guardian->id,
            'student_id' => $student->id,
            'relationship_type' => 'parent',
            'is_primary' => true,
        ]);

        $this->assertTrue($service->canAccessStudent($parentUser, $student));
        $this->assertFalse($service->canAccessStudent($otherParent, $student));
    }
}
