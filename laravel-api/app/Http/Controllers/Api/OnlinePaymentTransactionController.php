<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnlinePaymentTransaction;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnlinePaymentTransactionController extends Controller
{
    protected function resolveSchoolId(Request $request): int
    {
        $schoolId = $request->input('school_id') ?? $request->query('school_id');
        if (! empty($schoolId)) {
            return (int) $schoolId;
        }

        $user = $request->user();
        return (int) ($user?->active_school_id ?? 1);
    }

    public function index(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $query = OnlinePaymentTransaction::query()
            ->with(['payment.student', 'payment.receipts', 'payment.allocations.studentCharge.feeStructure.category'])
            ->where('school_id', $schoolId);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('gateway')) {
            $query->where('gateway', $request->query('gateway'));
        }

        $sort = $request->query('sort', '-created_at');
        if (str_starts_with($sort, '-')) {
            $col = ltrim($sort, '-');
            if ($col === 'created_date') {
                $col = 'created_at';
            }
            $query->orderByDesc($col);
        } else {
            $col = $sort === 'created_date' ? 'created_at' : $sort;
            $query->orderBy($col);
        }

        $limit = min((int) ($request->query('limit', 1000)), 5000);
        $txns = $query->limit($limit)->get();

        $formatted = $txns->map(fn (OnlinePaymentTransaction $tx) => $this->formatTransaction($tx));

        return response()->json($formatted);
    }

    public function show(OnlinePaymentTransaction $onlinePaymentTransaction): JsonResponse
    {
        $onlinePaymentTransaction->load(['payment.student', 'payment.receipts', 'payment.allocations.studentCharge.feeStructure.category']);
        return response()->json($this->formatTransaction($onlinePaymentTransaction));
    }

    public static function formatTransaction(OnlinePaymentTransaction $tx): array
    {
        $req = $tx->request_payload ?? [];
        $res = $tx->response_payload ?? [];
        $payment = $tx->payment;
        $student = $payment?->student;

        if (! $student && ! empty($req['student_id'])) {
            $student = Student::find($req['student_id']);
        }

        $receipt = $payment?->receipts?->first();
        $receiptNumber = $receipt?->receipt_number ?? ($res['receipt_number'] ?? null);

        $allocationPlan = $req['allocation_plan'] ?? [];
        if (empty($allocationPlan) && $payment && $payment->allocations->isNotEmpty()) {
            $allocationPlan = $payment->allocations->map(function ($alloc) {
                return [
                    'category_name' => $alloc->studentCharge?->feeStructure?->category?->name
                        ?? $alloc->studentCharge?->feeStructure?->name
                        ?? 'Fee Charge',
                    'amount' => (float) $alloc->amount,
                ];
            })->values()->all();
        }

        $split = $req['fee_split'] ?? $res['fee_split'] ?? [];

        return [
            'id' => $tx->id,
            'school_id' => $tx->school_id,
            'payment_id' => $tx->payment_id,
            'student_id' => $student?->id ?? ($req['student_id'] ?? null),
            'student_name' => $student?->full_name ?? ($req['student_name'] ?? 'Student'),
            'payer_name' => $req['payer_name'] ?? ($student?->full_name ?? 'Online Payer'),
            'gateway' => $tx->gateway,
            'internal_reference' => $tx->gateway_reference,
            'gateway_reference' => $res['gateway_reference'] ?? $tx->gateway_reference,
            'amount' => (float) ($payment?->amount ?? ($req['amount'] ?? 0)),
            'base_amount' => (float) ($split['base_amount'] ?? ($payment?->amount ?? ($req['amount'] ?? 0))),
            'gateway_fee' => (float) ($split['gateway_fee'] ?? 0),
            'platform_fee' => (float) ($split['platform_fee'] ?? 0),
            'convenience_fee' => (float) ($split['convenience_fee'] ?? 0),
            'total_payable' => (float) ($split['total_payable'] ?? ($payment?->amount ?? ($req['amount'] ?? 0))),
            'status' => $tx->status,
            'environment' => $req['environment'] ?? 'test',
            'authorization_url' => $res['authorization_url'] ?? null,
            'initiated_at' => $req['initiated_at'] ?? $tx->created_at?->toIso8601String(),
            'verified_at' => $res['verified_at'] ?? ($tx->status === 'success' ? $tx->updated_at?->toIso8601String() : null),
            'failure_reason' => $res['failure_reason'] ?? null,
            'receipt_number' => $receiptNumber,
            'allocation_plan' => $allocationPlan,
            'academic_session_id' => $req['academic_session_id'] ?? $payment?->academic_session_id,
            'term_id' => $req['term_id'] ?? $payment?->term_id,
            'session_name' => $req['session_name'] ?? '',
            'term_name' => $req['term_name'] ?? '',
            'created_at' => $tx->created_at?->toIso8601String(),
            'created_date' => $tx->created_at?->toIso8601String(),
        ];
    }
}
