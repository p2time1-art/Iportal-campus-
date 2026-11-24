<?php

namespace Tests\Unit;

use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\AdmissionDocument;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\GradingScheme;
use App\Models\GradingSchemeComponent;
use App\Models\GuardianRelationship;
use App\Models\JobApplication;
use App\Models\JobVacancy;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\OnlinePaymentTransaction;
use App\Models\ParentGuardian;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PaymentGatewayConfig;
use App\Models\Permission;
use App\Models\PlatformTransaction;
use App\Models\Receipt;
use App\Models\Result;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentCharge;
use App\Models\StudentClassMembership;
use App\Models\Subject;
use App\Models\Subscription;
use App\Models\SystemLog;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Models\Term;
use App\Models\TermRemark;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Tests\TestCase;

class DomainModelTest extends TestCase
{
    public function test_every_canonical_table_has_an_explicit_model_mapping(): void
    {
        $tables = [
            School::class => 'schools',
            Role::class => 'roles',
            Permission::class => 'permissions',
            RolePermission::class => 'role_permissions',
            User::class => 'users',
            UserSession::class => 'user_sessions',
            SchoolMembership::class => 'school_memberships',
            Student::class => 'students',
            Teacher::class => 'teachers',
            ParentGuardian::class => 'parent_guardians',
            GuardianRelationship::class => 'guardian_relationships',
            AcademicSession::class => 'academic_sessions',
            Term::class => 'terms',
            SchoolClass::class => 'school_classes',
            Subject::class => 'subjects',
            TeacherAssignment::class => 'teacher_assignments',
            StudentClassMembership::class => 'student_class_memberships',
            GradingScheme::class => 'grading_schemes',
            GradingSchemeComponent::class => 'grading_scheme_components',
            Result::class => 'results',
            Attendance::class => 'attendance',
            Assignment::class => 'assignments',
            AssignmentSubmission::class => 'assignment_submissions',
            TermRemark::class => 'term_remarks',
            FeeCategory::class => 'fee_categories',
            FeeStructure::class => 'fee_structures',
            StudentCharge::class => 'student_charges',
            Payment::class => 'payments',
            PaymentAllocation::class => 'payment_allocations',
            OnlinePaymentTransaction::class => 'online_payment_transactions',
            Receipt::class => 'receipts',
            Subscription::class => 'subscriptions',
            PlatformTransaction::class => 'platform_transactions',
            PaymentGatewayConfig::class => 'payment_gateway_configs',
            Announcement::class => 'announcements',
            Notification::class => 'notifications',
            NotificationRecipient::class => 'notification_recipients',
            JobVacancy::class => 'job_vacancies',
            JobApplication::class => 'job_applications',
            AdmissionApplication::class => 'admission_applications',
            Document::class => 'documents',
            AdmissionDocument::class => 'admission_documents',
            AuditLog::class => 'audit_logs',
            SystemLog::class => 'system_logs',
        ];

        $this->assertCount(44, $tables);

        foreach ($tables as $modelClass => $tableName) {
            $model = new $modelClass();

            $this->assertInstanceOf(Model::class, $model);
            $this->assertSame($tableName, $model->getTable());
            $this->assertSame('id', $model->getKeyName());
            $this->assertTrue($model->getIncrementing());
        }
    }

    public function test_schema_relationships_use_the_expected_eloquent_types(): void
    {
        $this->assertInstanceOf(BelongsToMany::class, (new Role())->permissions());
        $this->assertInstanceOf(BelongsToMany::class, (new School())->members());
        $this->assertInstanceOf(BelongsTo::class, (new SchoolMembership())->roleDefinition());
        $this->assertInstanceOf(HasMany::class, (new Teacher())->assignments());
        $this->assertInstanceOf(BelongsToMany::class, (new Student())->classes());
        $this->assertInstanceOf(BelongsToMany::class, (new ParentGuardian())->students());
        $this->assertInstanceOf(HasMany::class, (new Payment())->allocations());
        $this->assertInstanceOf(HasMany::class, (new Payment())->receipts());
    }

    public function test_models_without_updated_at_columns_disable_automatic_updated_timestamps(): void
    {
        foreach ([RolePermission::class, PaymentAllocation::class, NotificationRecipient::class, AdmissionDocument::class, AuditLog::class, SystemLog::class] as $modelClass) {
            $this->assertNull((new $modelClass())->getUpdatedAtColumn());
        }
    }

    public function test_financial_and_sensitive_fields_have_domain_casts_and_hiding(): void
    {
        $this->assertSame('decimal:2', (new Payment())->getCasts()['amount']);
        $this->assertSame('array', (new SchoolMembership())->getCasts()['permissions']);
        $this->assertContains('secret_key_ciphertext', (new PaymentGatewayConfig())->getHidden());
        $this->assertContains('password_hash', (new User())->getHidden());
        $this->assertContains('login_pin', (new User())->getHidden());
    }
}
