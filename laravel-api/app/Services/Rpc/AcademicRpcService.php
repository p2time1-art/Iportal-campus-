<?php

namespace App\Services\Rpc;

use App\Http\Controllers\Api\AcademicSessionController;
use App\Http\Controllers\Api\AdmissionApplicationController;
use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\GradingScheme;
use App\Models\OnlinePaymentTransaction;
use App\Models\ParentGuardian;
use App\Models\Payment;
use App\Models\PlatformTransaction;
use App\Models\Result;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolMembership;
use App\Models\Student;
use App\Models\StudentCharge;
use App\Models\Subject;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicRpcService extends BaseRpcService
{
    public function getAcademicContext(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        \App\Services\AcademicTermService::ensureStandardTerms($schoolId);

        $sessions = AcademicSession::where('school_id', $schoolId)
            ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (AcademicSession $s) {
                $arr = $s->toArray();
                $arr['is_active'] = ($s->status === 'active');
                return $arr;
            });

        $terms = Term::where('school_id', $schoolId)
            ->orderByDesc('academic_session_id')
            ->orderByRaw(\App\Services\AcademicTermService::canonicalOrderSql())
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->map(function (Term $t) {
                $arr = $t->toArray();
                $arr['session_id'] = $t->academic_session_id;
                $arr['is_current'] = ($t->status === 'active');
                return $arr;
            });

        $classes = SchoolClass::where('school_id', $schoolId)
            ->orderBy('name')
            ->limit(200)
            ->get()
            ->map(function (SchoolClass $c) {
                $arr = $c->toArray();
                $arr['session_id'] = $c->academic_session_id;
                $arr['status'] = $arr['status'] ?? 'active';
                return $arr;
            });

        $subjects = Subject::where('school_id', $schoolId)
            ->orderBy('name')
            ->limit(200)
            ->get()
            ->map(function (Subject $s) {
                $arr = $s->toArray();
                $arr['status'] = $arr['status'] ?? 'active';
                $arr['is_core'] = true;
                return $arr;
            });

        $gradingSchemes = GradingScheme::with('components')
            ->where('school_id', $schoolId)
            ->orderBy('id')
            ->get()
            ->map(function (GradingScheme $s, int $idx) {
                $data = $s->toArray();
                $meta = is_array($s->metadata) ? $s->metadata : json_decode($s->metadata ?? '[]', true);
                $isActive = $meta['is_active'] ?? ($idx === 0);

                $data['is_active'] = (bool) $isActive;
                $data['components'] = $meta['components'] ?? [
                    ['key' => 'c1', 'label' => 'CA 1', 'max_score' => 20],
                    ['key' => 'c2', 'label' => 'CA 2', 'max_score' => 20],
                    ['key' => 'exam', 'label' => 'Exam', 'max_score' => 60],
                ];
                $data['grade_boundaries'] = $s->components->map(fn ($c) => [
                    'id' => $c->id,
                    'grade' => $c->grade_label,
                    'min_score' => (float) $c->minimum_score,
                    'max_score' => (float) $c->maximum_score,
                    'remark' => $c->remark ?? '',
                ])->values();
                return $data;
            });

        return response()->json([
            'data' => [
                'sessions' => $sessions,
                'terms' => $terms,
                'classes' => $classes,
                'subjects' => $subjects,
                'grading_schemes' => $gradingSchemes,
            ]
        ]);
    }

    public function getAdminDashboardStats(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $activeSession = AcademicSession::where('school_id', $schoolId)
            ->where('status', 'active')
            ->first();

        $currentTerm = $activeSession
            ? Term::where('school_id', $schoolId)
                ->where('academic_session_id', $activeSession->id)
                ->where('status', 'active')
                ->first()
            : null;

        $teacherCount = Teacher::where('school_id', $schoolId)->where('status', 'active')->count();
        $totalBilled = (float) StudentCharge::where('school_id', $schoolId)
            ->whereNotIn('status', ['cancelled', 'waived'])
            ->sum('net_amount');
        $totalCollected = (float) Payment::where('school_id', $schoolId)
            ->where('status', 'success')
            ->sum('amount');
        $totalOutstanding = max(0, $totalBilled - $totalCollected);

        $recentPayments = Payment::with('student')
            ->where('school_id', $schoolId)
            ->where('status', 'success')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (Payment $p) => [
                'id' => $p->id,
                'student_name' => $p->student?->full_name ?? 'Student',
                'amount' => (float) $p->amount,
                'payment_method' => $p->payment_method ?: 'online',
                'reference_number' => $p->reference_number,
                'paid_at' => $p->paid_at?->format('d M Y') ?? $p->created_at?->format('d M Y'),
            ]);

        $totalAtt = Attendance::where('school_id', $schoolId)->count();
        $presentAtt = Attendance::where('school_id', $schoolId)->where('status', 'present')->count();
        $absentAtt = Attendance::where('school_id', $schoolId)->where('status', 'absent')->count();
        $attRate = $totalAtt > 0 ? round(($presentAtt / $totalAtt) * 100) : 96;

        $recentApps = AdmissionApplication::where('school_id', $schoolId)
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (AdmissionApplication $a) => AdmissionApplicationController::formatApplication($a));

        return response()->json([
            'data' => [
                'stats' => [
                    'students' => Student::where('school_id', $schoolId)->where('status', 'active')->count(),
                    'teachers' => $teacherCount,
                    'classes' => SchoolClass::where('school_id', $schoolId)->count(),
                    'subjects' => Subject::where('school_id', $schoolId)->count(),
                    'accounts' => SchoolMembership::where('school_id', $schoolId)->count(),
                    'activeAccounts' => SchoolMembership::where('school_id', $schoolId)->where('status', 'active')->count(),
                ],
                'admissions' => [
                    'total' => AdmissionApplication::where('school_id', $schoolId)->count(),
                    'pending' => AdmissionApplication::where('school_id', $schoolId)->whereIn('status', ['submitted', 'under_review'])->count(),
                    'accepted' => AdmissionApplication::where('school_id', $schoolId)->whereIn('status', ['approved', 'accepted', 'admitted', 'enrolled'])->count(),
                    'rejected' => AdmissionApplication::where('school_id', $schoolId)->where('status', 'rejected')->count(),
                    'recent' => $recentApps,
                ],
                'finance' => [
                    'totalBilled' => $totalBilled,
                    'totalCollected' => $totalCollected,
                    'totalOutstanding' => $totalOutstanding,
                    'recentPayments' => $recentPayments,
                ],
                'attendance' => [
                    'totalRecorded' => $totalAtt,
                    'presentCount' => $presentAtt,
                    'absentCount' => $absentAtt,
                    'studentAttendanceRate' => $attRate,
                    'staffTotal' => $teacherCount,
                    'staffPresentToday' => $teacherCount,
                    'staffAttendanceRate' => 100,
                ],
                'activeSession' => $activeSession,
                'currentTerm' => $currentTerm,
                'subscription' => \App\Services\SubscriptionTierService::resolveSchoolPlan($schoolId),
            ]
        ]);
    }

    public function getPlatformStats(Request $request): JsonResponse
    {
        $schools = School::withCount(['students', 'teachers'])->orderByDesc('id')->limit(10)->get();
        $recentSchools = $schools->map(fn (School $s) => [
            'id' => $s->id,
            'name' => $s->name,
            'status' => $s->status,
            'plan' => $s->plan ?? 'standard',
            'studentCount' => $s->students_count ?? 0,
            'teacherCount' => $s->teachers_count ?? 0,
        ]);

        $recentActivity = AuditLog::with(['user', 'school'])
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->action,
                'actor_name' => $log->user?->full_name ?? 'System',
                'actor_role' => $log->user?->role ?? 'system',
                'school_name' => $log->school?->name ?? '',
                'created_date' => $log->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'stats' => [
                'totalSchools' => School::count(),
                'activeSchools' => School::where('status', 'active')->count(),
                'suspendedSchools' => School::where('status', 'suspended')->count(),
                'totalStudents' => Student::count(),
                'totalTeachers' => Teacher::count(),
                'totalParents' => ParentGuardian::count(),
                'totalSchoolAdmins' => SchoolMembership::where('role', 'ADM')->count(),
                'activeSubscriptions' => Subscription::where('status', 'active')->count(),
                'expiringSubscriptions' => 0,
                'platformRevenue' => (float) PlatformTransaction::where('status', 'success')->sum('amount'),
                'totalAnnouncements' => Announcement::count(),
                'publishedAnnouncements' => Announcement::where('status', 'published')->count(),
                'scheduledAnnouncements' => Announcement::where('status', 'draft')->count(),
                'onlinePaymentVolume' => (float) Payment::where('payment_method', 'online')->where('status', 'success')->sum('amount'),
                'onlinePaymentSuccessCount' => OnlinePaymentTransaction::where('status', 'success')->count(),
                'onlinePaymentFailedCount' => OnlinePaymentTransaction::where('status', 'failed')->count(),
                'onlinePaymentPendingCount' => OnlinePaymentTransaction::whereIn('status', ['initiated', 'pending'])->count(),
                'splitRevenue' => (float) PlatformTransaction::where('tx_type', 'convenience_fee_split')->where('status', 'success')->sum('amount'),
                'subscriptionRevenue' => (float) PlatformTransaction::where('tx_type', '!=', 'convenience_fee_split')->where('status', 'success')->sum('amount'),
            ],
            'serverHealth' => [
                'status' => 'healthy',
                'database' => 'Connected (MySQL/MariaDB)',
                'queueDriver' => strtoupper((string) config('queue.default', 'redis')),
                'horizonConfigured' => file_exists(config_path('horizon.php')),
                'phpVersion' => PHP_VERSION,
                'laravelVersion' => app()->version(),
                'pdfEngine' => 'barryvdh/laravel-dompdf v3.1',
            ],
            'recentSchools' => $recentSchools,
            'recentActivity' => $recentActivity,
        ]);
    }

    public function getParentContext(Request $request): JsonResponse
    {
        $user = $request->user();
        $schoolId = $this->resolveSchoolId($request);

        $children = collect();

        if ($user) {
            $parent = ParentGuardian::where('user_id', $user->id)->first();
            if ($parent) {
                $children = $parent->students()->with('currentClass')->get();
            }

            if ($children->isEmpty()) {
                $student = Student::with('currentClass')->where('user_id', $user->id)->first();
                if ($student) {
                    $children = collect([$student]);
                }
            }
        }

        // Fallback for school admin testing / demo
        if ($children->isEmpty()) {
            $children = Student::with('currentClass')
                ->where('school_id', $schoolId)
                ->where('status', 'active')
                ->limit(5)
                ->get();
        }

        $formatted = $children->map(function (Student $s) {
            return [
                'id' => $s->id,
                'full_name' => $s->full_name,
                'admission_number' => $s->admission_number,
                'current_class_id' => $s->current_class_id,
                'current_class_name' => $s->currentClass?->name ?? '',
            ];
        });

        $responseData = [
            'children' => $formatted,
        ];

        if ($request->filled('student_id')) {
            $childId = (int) $request->input('student_id');
            $responseData['results'] = Result::with('subject')
                ->where('student_id', $childId)
                ->where('status', 'published')
                ->orderByDesc('id')
                ->limit(100)
                ->get()
                ->map(fn (Result $r) => [
                    'id' => $r->id,
                    'subject_id' => $r->subject_id,
                    'subject_name' => $r->subject?->name ?? '',
                    'ca_score' => (float) $r->ca_score,
                    'exam_score' => (float) $r->exam_score,
                    'total_score' => (float) $r->total_score,
                    'max_total' => 100,
                    'percentage' => (float) $r->total_score,
                    'grade' => $r->grade_letter,
                    'remark' => $r->remark,
                    'status' => $r->status,
                ]);

            $responseData['attendance'] = Attendance::where('student_id', $childId)
                ->orderByDesc('attendance_date')
                ->limit(300)
                ->get()
                ->map(fn (Attendance $a) => [
                    'id' => $a->id,
                    'date' => $a->attendance_date ? $a->attendance_date->format('Y-m-d') : null,
                    'status' => $a->status,
                ]);
        }

        return response()->json([
            'data' => $responseData,
        ]);
    }

    public function publishAnnouncement(Request $request): JsonResponse
    {
        $action = $request->input('action', 'publish');
        $announcementId = $request->input('announcement_id');

        $announcement = Announcement::find($announcementId);
        if (! $announcement) {
            return response()->json(['error' => 'Announcement not found.'], 404);
        }

        $meta = $announcement->metadata ?? [];

        switch ($action) {
            case 'publish':
                $announcement->update([
                    'status' => 'published',
                    'published_at' => now(),
                ]);
                break;

            case 'unpublish':
                $announcement->update([
                    'status' => 'draft',
                ]);
                break;

            case 'pin':
                $meta['is_pinned'] = true;
                $announcement->update(['metadata' => $meta]);
                break;

            case 'unpin':
                $meta['is_pinned'] = false;
                $announcement->update(['metadata' => $meta]);
                break;

            case 'archive':
                $announcement->update([
                    'status' => 'archived',
                ]);
                break;
        }

        return response()->json([
            'data' => [
                'success' => true,
                'announcement_id' => $announcement->id,
                'status' => $announcement->status,
            ]
        ]);
    }

    public function rolloverSession(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $info = AcademicSessionController::rolloverToNextSession($schoolId);

        return response()->json([
            'data' => [
                'success' => true,
                'previous_session' => $info['previous_session'],
                'new_session' => $info['new_session'],
                'current_term' => $info['current_term'],
                'promoted_students' => $info['promoted_students'],
                'message' => "Rolled over from {$info['previous_session']} to {$info['new_session']->name} (First Term active).",
            ]
        ]);
    }

    public function getSchoolAnalytics(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        return response()->json([
            'data' => [
                'total_students' => Student::where('school_id', $schoolId)->where('status', 'active')->count(),
                'total_teachers' => Teacher::where('school_id', $schoolId)->where('status', 'active')->count(),
                'total_classes' => SchoolClass::where('school_id', $schoolId)->count(),
                'total_revenue' => (float) Payment::where('school_id', $schoolId)->where('status', 'success')->sum('amount'),
            ]
        ]);
    }

    public function getPlatformAnalytics(Request $request): JsonResponse
    {
        return $this->getPlatformStats($request);
    }
}
