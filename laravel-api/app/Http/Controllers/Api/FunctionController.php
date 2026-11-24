<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Rpc\AcademicRpcService;
use App\Services\Rpc\AdmissionRpcService;
use App\Services\Rpc\BulkOperationsRpcService;
use App\Services\Rpc\FinanceRpcService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FunctionController extends Controller
{
    public function __construct(
        protected AcademicRpcService $academicRpc,
        protected FinanceRpcService $financeRpc,
        protected AdmissionRpcService $admissionRpc,
        protected BulkOperationsRpcService $bulkRpc,
    ) {}

    public function handle(Request $request, string $name): JsonResponse
    {
        // Enforce Super Admin feature flags on feature-scoped RPCs
        $featureMap = [
            'initializeOnlinePayment' => 'online_payments',
            'getOnlinePaymentStatus' => 'online_payments',
            'submitAdmissionApplication' => 'admissions_portal',
            'payApplicationFee' => 'admissions_portal',
            'finalizeAdmissionApplication' => 'admissions_portal',
            'checkApplicationStatus' => 'admissions_portal',
            'admittedStudentSignup' => 'admissions_portal',
            'submitJobApplication' => 'recruitment',
            'checkJobApplicationStatus' => 'recruitment',
            'getSchoolAnalytics' => 'analytics',
        ];

        if (isset($featureMap[$name])) {
            $user = $request->user();
            $isSuperAdmin = $user && ($user->is_super_admin || strtoupper((string) $user->active_role) === 'SAD');
            if (! $isSuperAdmin) {
                $schoolId = $request->input('school_id') ?? $request->query('school_id') ?? $user?->active_school_id;
                $featureKey = $featureMap[$name];
                if (! \App\Services\FeatureFlagService::isEnabled($featureKey, ! empty($schoolId) ? (int) $schoolId : null)) {
                    $item = \App\Services\FeatureFlagService::getCatalogItem($featureKey);
                    $label = $item['label'] ?? $featureKey;

                    return response()->json([
                        'error' => "The '{$label}' feature is currently disabled by the platform administrator.",
                        'feature_key' => $featureKey,
                        'feature_disabled' => true,
                    ], 403);
                }
            }
        }

        return match ($name) {
            // Academic & Analytics RPCs
            'getAcademicContext' => $this->academicRpc->getAcademicContext($request),
            'getAdminDashboardStats' => $this->academicRpc->getAdminDashboardStats($request),
            'getPlatformStats' => $this->academicRpc->getPlatformStats($request),
            'getParentContext' => $this->academicRpc->getParentContext($request),
            'publishAnnouncement' => $this->academicRpc->publishAnnouncement($request),
            'rolloverSession' => $this->academicRpc->rolloverSession($request),
            'promoteStudents' => $this->bulkRpc->promoteStudents($request),
            'bulkImportStudents' => $this->bulkRpc->bulkImportStudents($request),
            'bulkImportTeachers' => $this->bulkRpc->bulkImportTeachers($request),
            'bulkImportScores' => $this->bulkRpc->bulkImportScores($request),
            'getSchoolAnalytics' => $this->academicRpc->getSchoolAnalytics($request),
            'getPlatformAnalytics' => $this->academicRpc->getPlatformAnalytics($request),

            // Finance, Payments & Subscriptions RPCs
            'assignFees' => $this->financeRpc->assignFees($request),
            'recordPayment' => $this->financeRpc->recordPayment($request),
            'reversePayment' => $this->financeRpc->reversePayment($request),
            'getStudentFinance' => $this->financeRpc->getStudentFinance($request),
            'manageGatewayConfig' => $this->financeRpc->manageGatewayConfig($request),
            'initializeOnlinePayment' => $this->financeRpc->initializeOnlinePayment($request),
            'getOnlinePaymentStatus' => $this->financeRpc->getOnlinePaymentStatus($request),
            'handlePaystackWebhook' => $this->financeRpc->handlePaystackWebhook($request),
            'manageSubscription' => $this->financeRpc->manageSubscription($request),
            'managePlatformTransaction' => $this->financeRpc->managePlatformTransaction($request),

            // Admissions, Recruitment & User Account RPCs
            'getPublicAdmissionContext' => $this->admissionRpc->getPublicAdmissionContext($request),
            'submitAdmissionApplication' => $this->admissionRpc->submitAdmissionApplication($request),
            'payApplicationFee' => $this->admissionRpc->payApplicationFee($request),
            'finalizeAdmissionApplication' => $this->admissionRpc->finalizeAdmissionApplication($request),
            'checkApplicationStatus' => $this->admissionRpc->checkApplicationStatus($request),
            'getAcceptedApplicants' => $this->admissionRpc->getAcceptedApplicants($request),
            'admittedStudentSignup' => $this->admissionRpc->admittedStudentSignup($request),
            'submitJobApplication' => $this->admissionRpc->submitJobApplication($request),
            'checkJobApplicationStatus' => $this->admissionRpc->checkJobApplicationStatus($request),
            'onboardUser' => $this->admissionRpc->onboardUser($request),
            'manageUserAccount' => $this->admissionRpc->manageUserAccount($request),
            'manageUserPin' => $this->admissionRpc->manageUserPin($request),
            'getUserAccountDetails' => $this->admissionRpc->getUserAccountDetails($request),
            'manageAdmin' => $this->admissionRpc->manageAdmin($request),
            'manageSchool' => $this->admissionRpc->manageSchool($request),

            default => response()->json(['error' => "Function '{$name}' not implemented."], 404),
        };
    }
}
