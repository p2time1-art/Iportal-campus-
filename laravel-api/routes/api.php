<?php

use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\AdmissionApplicationController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AssignmentSubmissionController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassAssignmentController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\FeatureFlagController;
use App\Http\Controllers\Api\FeeCategoryController;
use App\Http\Controllers\Api\FeeStructureController;
use App\Http\Controllers\Api\FunctionController;
use App\Http\Controllers\Api\GradingSchemeController;
use App\Http\Controllers\Api\GuardianRelationshipController;
use App\Http\Controllers\Api\JobVacancyController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationPipelineController;
use App\Http\Controllers\Api\OnlinePaymentTransactionController;
use App\Http\Controllers\Api\ParentGuardianController;
use App\Http\Controllers\Api\PaymentAllocationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlatformSettingController;
use App\Http\Controllers\Api\PlatformTransactionController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SchoolMembershipController;
use App\Http\Controllers\Api\StudentChargeController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TeacherAssignmentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TermController;
use App\Http\Controllers\Api\TermRemarkController;
use App\Http\Controllers\Api\TimetableEntryController;
use App\Http\Controllers\Api\WebhookController;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication & Webhook Endpoints (Paystack, Flutterwave, Monnify)
Route::get('/auth/csrf', [AuthController::class, 'csrf']);
Route::middleware('api.csrf')->post('/auth/login', [AuthController::class, 'login']);
Route::post('/v1/webhooks/{gateway}', [WebhookController::class, 'handle']);
Route::post('/webhooks/{gateway}', [WebhookController::class, 'handle']);

$registerPublicOrHybridRoutes = function () {
    Route::middleware(['auth.token:optional', 'school.scope'])->group(function () {
        Route::get('tenant/resolve', [SchoolController::class, 'resolveContext']);
        Route::get('feature-flags', [FeatureFlagController::class, 'index']);
        Route::get('public/announcements', [AnnouncementController::class, 'publicIndex']);
        Route::get('public/announcements/{id}', [AnnouncementController::class, 'publicShow']);
        Route::post('documents/upload', [DocumentController::class, 'upload']);
        Route::get('documents/verify/{code}', [DocumentController::class, 'verifyDocument']);
        Route::get('documents/report-card/pdf', [DocumentController::class, 'reportCardPdf']);
        Route::get('documents/receipt/{id}/pdf', [DocumentController::class, 'receiptPdf']);
        Route::get('documents/invoice/{studentId}/pdf', [DocumentController::class, 'invoicePdf']);
        Route::get('documents/id-cards/pdf', [DocumentController::class, 'studentIdCardsPdf']);
        Route::get('documents/admission-letter/{id}/pdf', [DocumentController::class, 'admissionLetterPdf']);
        Route::post('functions/{name}', [FunctionController::class, 'handle']);
        Route::get('job-vacancies', [JobVacancyController::class, 'index']);
    });
};

Route::prefix('v1')->group($registerPublicOrHybridRoutes);
$registerPublicOrHybridRoutes();

// Authenticated Routes
Route::middleware(['auth.token', 'school.scope'])->group(function () {
    // Auth Session Endpoints
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
    Route::get('/user', fn (Request $request) => $request->user());

    // Domain Routes (registered for both /v1 prefix and unprefixed)
    $registerDomainRoutes = function () {
        // Schools, Subscriptions & Memberships
        Route::apiResource('schools', SchoolController::class)->only(['index', 'show', 'store', 'update']);
        Route::apiResource('memberships', SchoolMembershipController::class)->only(['index', 'show', 'update']);
        Route::apiResource('subscriptions', SubscriptionController::class)->only(['index', 'show', 'store', 'update']);
        Route::apiResource('platform-transactions', PlatformTransactionController::class)->only(['index']);
        Route::apiResource('audit-logs', AuditLogController::class)->only(['index']);

        // Academic Sessions
        Route::apiResource('sessions', AcademicSessionController::class);
        Route::post('sessions/{id}/activate', [AcademicSessionController::class, 'activate']);

        // Terms
        Route::apiResource('terms', TermController::class);
        Route::post('terms/{id}/set-current', [TermController::class, 'setCurrent']);

        // Classes & Timetables
        Route::apiResource('classes', SchoolClassController::class);
        Route::apiResource('timetable-entries', TimetableEntryController::class)->only(['index', 'store', 'destroy']);

        // Subjects
        Route::apiResource('subjects', SubjectController::class);

        // Students
        Route::apiResource('students', StudentController::class);
        Route::get('students/{id}/history', [StudentController::class, 'history']);

        // Teachers
        Route::apiResource('teachers', TeacherController::class);
        Route::get('teachers/{id}/assignments', [TeacherController::class, 'assignments']);

        // Parents & Guardians
        Route::apiResource('parents', ParentGuardianController::class)->middleware('feature:parents');
        Route::apiResource('guardian-relationships', GuardianRelationshipController::class)->only(['index', 'store', 'destroy'])->middleware('feature:parents');

        // Teacher Assignments & Class Memberships
        Route::apiResource('teacher-assignments', TeacherAssignmentController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('class-assignments', ClassAssignmentController::class)->only(['index', 'store', 'destroy']);

        // Attendance
        Route::post('attendance/batch', [AttendanceController::class, 'batch']);
        Route::apiResource('attendance', AttendanceController::class);

        // Grading & Results
        Route::apiResource('grading-schemes', GradingSchemeController::class);
        Route::post('results/compute-rankings', [ResultController::class, 'computeRankings']);
        Route::apiResource('results', ResultController::class);

        // Term Remarks
        Route::apiResource('term-remarks', TermRemarkController::class);

        // Assignments & Submissions
        Route::apiResource('assignments', AssignmentController::class);
        Route::apiResource('assignment-submissions', AssignmentSubmissionController::class);

        // Finance Domain
        Route::apiResource('fee-categories', FeeCategoryController::class);
        Route::apiResource('fee-structures', FeeStructureController::class);
        Route::apiResource('student-charges', StudentChargeController::class);
        Route::post('payments/{payment}/reverse', [PaymentController::class, 'reverse']);
        Route::apiResource('payments', PaymentController::class);
        Route::apiResource('receipts', ReceiptController::class)->only(['index', 'show']);
        Route::apiResource('payment-allocations', PaymentAllocationController::class)->only(['index']);
        Route::apiResource('online-payment-transactions', OnlinePaymentTransactionController::class)->only(['index', 'show']);

        // Admissions & Recruitment
        Route::post('admission-applications/{id}/enroll', [AdmissionApplicationController::class, 'enroll'])->middleware('feature:admissions_portal');
        Route::apiResource('admission-applications', AdmissionApplicationController::class)->only(['index', 'show', 'update', 'destroy'])->middleware('feature:admissions_portal');
        Route::post('job-vacancies', [JobVacancyController::class, 'store'])->middleware('feature:recruitment');

        // Communication & Asynchronous Background Pipeline Domain
        Route::apiResource('announcements', AnnouncementController::class);
        Route::apiResource('notifications', NotificationController::class);
        Route::get('pipeline/status', [NotificationPipelineController::class, 'status']);
        Route::post('pipeline/emails/dispatch', [NotificationPipelineController::class, 'dispatchEmail']);
        Route::post('pipeline/alerts/dispatch', [NotificationPipelineController::class, 'dispatchAlert'])->middleware('feature:bulk_messaging');
        Route::post('pipeline/report-cards/compile', [NotificationPipelineController::class, 'compileBulkReportCards'])->middleware('feature:pdf_documents');

        // Super Admin Feature Flags & Platform Settings
        Route::post('feature-flags/toggle', [FeatureFlagController::class, 'toggle']);
        Route::get('platform/settings', [PlatformSettingController::class, 'show']);
        Route::patch('platform/settings', [PlatformSettingController::class, 'update']);
    };

    // Both prefixed with /v1 and unprefixed for direct compatibility
    Route::prefix('v1')->group($registerDomainRoutes);
    $registerDomainRoutes();
});
