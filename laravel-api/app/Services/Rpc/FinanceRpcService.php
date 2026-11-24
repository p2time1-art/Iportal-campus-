<?php

namespace App\Services\Rpc;

use App\Http\Controllers\Api\OnlinePaymentTransactionController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\WebhookController;
use App\Models\FeeStructure;
use App\Models\OnlinePaymentTransaction;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PaymentGatewayConfig;
use App\Models\PlatformTransaction;
use App\Models\Receipt;
use App\Models\Student;
use App\Models\StudentCharge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FinanceRpcService extends BaseRpcService
{
    public function assignFees(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $sessionId = $request->input('academic_session_id');
        $termId = $request->input('term_id');
        $classId = $request->input('class_id');
        $studentIds = $request->input('student_ids');

        if (! $sessionId) {
            return response()->json(['error' => 'Academic session is required.'], 422);
        }

        // Query applicable fee structures
        $fsQuery = FeeStructure::where('school_id', $schoolId)
            ->where('status', 'active')
            ->where('academic_session_id', $sessionId);

        if ($termId) {
            $fsQuery->where(function ($q) use ($termId) {
                $q->whereNull('term_id')->orWhere('term_id', $termId);
            });
        }

        if ($classId) {
            $fsQuery->where(function ($q) use ($classId) {
                $q->whereNull('class_id')->orWhere('class_id', $classId);
            });
        }

        $structures = $fsQuery->get();

        if ($structures->isEmpty()) {
            return response()->json([
                'data' => [
                    'created' => 0,
                    'skipped' => 0,
                    'message' => 'No active fee structures found for the selected scope.',
                ]
            ]);
        }

        // Resolve students
        if (! empty($studentIds) && is_array($studentIds)) {
            $students = Student::with('classMemberships')->where('school_id', $schoolId)->whereIn('id', $studentIds)->get();
        } elseif ($classId) {
            $students = Student::with('classMemberships')
                ->where('school_id', $schoolId)
                ->where('status', 'active')
                ->whereHas('classMemberships', fn ($q) => $q->where('class_id', $classId))
                ->get();
        } else {
            $students = Student::with('classMemberships')
                ->where('school_id', $schoolId)
                ->where('status', 'active')
                ->get();
        }

        $created = 0;
        $skipped = 0;

        foreach ($students as $student) {
            foreach ($structures as $fs) {
                if ($fs->class_id && $fs->class_id != $student->current_class_id) {
                    continue;
                }

                $existing = StudentCharge::where('school_id', $schoolId)
                    ->where('student_id', $student->id)
                    ->where('fee_structure_id', $fs->id)
                    ->first();

                if ($existing) {
                    $skipped++;
                    continue;
                }

                StudentCharge::create([
                    'school_id' => $schoolId,
                    'student_id' => $student->id,
                    'fee_structure_id' => $fs->id,
                    'academic_session_id' => $fs->academic_session_id ?? $sessionId,
                    'term_id' => $fs->term_id ?? ($termId ?: null),
                    'amount' => $fs->amount,
                    'discount_amount' => 0,
                    'net_amount' => $fs->amount,
                    'currency' => $fs->currency ?? 'NGN',
                    'due_date' => $fs->due_date ? $fs->due_date->format('Y-m-d') : null,
                    'status' => 'pending',
                ]);
                $created++;
            }
        }

        return response()->json([
            'data' => [
                'created' => $created,
                'skipped' => $skipped,
            ]
        ]);
    }

    public function recordPayment(Request $request): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'finance.record_payment')) {
            return response()->json([
                'error' => 'Access denied: Exam Officer / Principal role cannot record financial payments.',
                'message' => 'Access denied: Exam Officer / Principal role cannot record financial payments.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'payment_date' => 'nullable|date',
            'payment_reference' => 'nullable|string',
            'academic_session_id' => 'nullable',
            'term_id' => 'nullable',
            'notes' => 'nullable|string',
        ]);

        $ref = ! empty($validated['payment_reference'])
            ? $validated['payment_reference']
            : ('PAY-' . date('Ymd') . '-' . strtoupper(Str::random(6)));

        $paidDate = ! empty($validated['payment_date']) ? $validated['payment_date'] : now();

        $payment = Payment::create([
            'school_id' => $schoolId,
            'student_id' => $validated['student_id'],
            'user_id' => $request->user()?->id,
            'amount' => $validated['amount'],
            'currency' => 'NGN',
            'payment_method' => $validated['payment_method'],
            'status' => 'success',
            'reference_number' => $ref,
            'academic_session_id' => ! empty($validated['academic_session_id']) ? $validated['academic_session_id'] : null,
            'term_id' => ! empty($validated['term_id']) ? $validated['term_id'] : null,
            'notes' => $validated['notes'] ?? null,
            'paid_at' => $paidDate,
            'metadata' => [
                'notes' => $validated['notes'] ?? null,
                'academic_session_id' => $validated['academic_session_id'] ?? null,
                'term_id' => $validated['term_id'] ?? null,
            ],
        ]);

        // Auto-allocate against student charges (FIFO)
        $remaining = (float) $validated['amount'];
        $allocations = [];

        $charges = StudentCharge::with('feeStructure.category')
            ->where('school_id', $schoolId)
            ->where('student_id', $validated['student_id'])
            ->whereNotIn('status', ['paid', 'waived', 'cancelled'])
            ->orderBy('id')
            ->get();

        foreach ($charges as $charge) {
            if ($remaining <= 0) break;

            $paidSoFar = (float) $charge->paymentAllocations()
                ->whereHas('payment', fn ($q) => $q->where('status', 'success'))
                ->sum('amount');
            $net = (float) ($charge->net_amount > 0 ? $charge->net_amount : ($charge->amount - ($charge->discount_amount ?? 0)));
            $due = max(0, $net - $paidSoFar);

            if ($due > 0) {
                $allocAmt = min($remaining, $due);
                $alloc = PaymentAllocation::create([
                    'school_id' => $schoolId,
                    'payment_id' => $payment->id,
                    'student_charge_id' => $charge->id,
                    'amount' => $allocAmt,
                ]);
                $catName = $charge->feeStructure?->category?->name ?? ($charge->feeStructure?->name ?? 'Fee Charge');
                $allocations[] = [
                    'id' => $alloc->id,
                    'student_charge_id' => $charge->id,
                    'fee_name' => $charge->feeStructure?->name ?? 'Fee Charge',
                    'category_name' => $catName,
                    'amount' => $allocAmt,
                ];
                $remaining -= $allocAmt;

                if ($paidSoFar + $allocAmt >= $net) {
                    $charge->update(['status' => 'paid', 'paid_at' => now()]);
                } else {
                    $charge->update(['status' => 'partial']);
                }
            }
        }

        // Create Receipt
        $receipt = Receipt::create([
            'school_id' => $schoolId,
            'payment_id' => $payment->id,
            'receipt_number' => 'REC-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
            'issued_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'payment_id' => $payment->id,
                'receipt_id' => $receipt->id,
                'receipt_number' => $receipt->receipt_number,
                'allocations' => $allocations,
            ]
        ], 201);
    }

    public function reversePayment(Request $request): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'finance.reverse_payment')) {
            return response()->json([
                'error' => 'Access denied: Exam Officer / Principal role cannot reverse financial payments.',
                'message' => 'Access denied: Exam Officer / Principal role cannot reverse financial payments.',
            ], 403);
        }

        $paymentId = $request->input('payment_id');
        $reason = $request->input('reason', 'Reversed by administrator');

        $payment = Payment::with('allocations.studentCharge')->find($paymentId);
        if (! $payment) {
            return response()->json(['error' => 'Payment record not found.'], 404);
        }

        $payment->update([
            'status' => 'reversed',
            'notes' => ($payment->notes ? $payment->notes . ' | ' : '') . "Reversed: {$reason}",
        ]);

        foreach ($payment->allocations as $alloc) {
            $charge = $alloc->studentCharge;
            if ($charge) {
                $remainingPaid = (float) $charge->paymentAllocations()
                    ->where('payment_id', '!=', $payment->id)
                    ->whereHas('payment', fn ($q) => $q->where('status', 'success'))
                    ->sum('amount');
                $net = (float) ($charge->net_amount > 0 ? $charge->net_amount : $charge->amount);

                if ($remainingPaid >= $net && $net > 0) {
                    $charge->update(['status' => 'paid']);
                } elseif ($remainingPaid > 0) {
                    $charge->update(['status' => 'partial', 'paid_at' => null]);
                } else {
                    $charge->update(['status' => 'pending', 'paid_at' => null]);
                }
            }
        }

        return response()->json([
            'data' => [
                'success' => true,
                'message' => 'Payment reversed successfully.',
            ]
        ]);
    }

    public function getStudentFinance(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id');
        $student = Student::with('currentClass')->find($studentId);

        if (! $student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $charges = StudentCharge::with([
            'academicSession',
            'term',
            'feeStructure.category',
            'feeStructure.academicSession',
            'feeStructure.term',
            'paymentAllocations.payment',
        ])->where('student_id', $studentId)->get();

        $formattedCharges = $charges->map(function (StudentCharge $c) {
            $allocSum = (float) $c->paymentAllocations
                ->filter(fn ($a) => $a->payment?->status === 'success')
                ->sum('amount');
            $amount = (float) $c->amount;
            $discount = (float) ($c->discount_amount ?? 0);
            $net = (float) ($c->status === 'waived' ? 0 : ($c->net_amount > 0 ? $c->net_amount : max(0, $amount - $discount)));
            $outstanding = max(0, $net - $allocSum);

            $status = $c->status;
            if (! in_array($status, ['waived', 'cancelled'])) {
                if ($outstanding <= 0 && $net > 0) {
                    $status = 'paid';
                } elseif ($allocSum > 0) {
                    $status = 'partially_paid';
                } else {
                    $status = 'pending';
                }
            }

            $sessionId = $c->academic_session_id ?? $c->feeStructure?->academic_session_id;
            $termId = $c->term_id ?? $c->feeStructure?->term_id;
            $sessionName = $c->academicSession?->name ?? $c->feeStructure?->academicSession?->name ?? '';
            $termName = $c->term?->name ?? $c->feeStructure?->term?->name ?? '';

            return [
                'id' => $c->id,
                'name' => $c->feeStructure?->name ?? 'Fee Charge',
                'category_name' => $c->feeStructure?->category?->name ?? 'General',
                'academic_session_id' => $sessionId,
                'term_id' => $termId,
                'session_name' => $sessionName,
                'term_name' => $termName,
                'amount' => $amount,
                'discount_amount' => $discount,
                'net_amount' => $net,
                'amount_paid' => $allocSum,
                'outstanding' => $outstanding,
                'status' => $status,
                'due_date' => $c->due_date ? $c->due_date->format('Y-m-d') : null,
            ];
        });

        $payments = Payment::with(['receipts', 'allocations.studentCharge.feeStructure.category'])
            ->where('student_id', $studentId)
            ->orderByDesc('paid_at')
            ->get();

        $formattedPayments = $payments->map(function (Payment $p) {
            return [
                'id' => $p->id,
                'school_id' => $p->school_id,
                'student_id' => $p->student_id,
                'amount' => (float) $p->amount,
                'currency' => $p->currency ?? 'NGN',
                'payment_method' => $p->payment_method,
                'payment_reference' => $p->reference_number,
                'reference_number' => $p->reference_number,
                'payment_date' => $p->paid_at ? $p->paid_at->format('Y-m-d') : ($p->created_at ? $p->created_at->format('Y-m-d') : null),
                'academic_session_id' => $p->academic_session_id ?? ($p->metadata['academic_session_id'] ?? null),
                'term_id' => $p->term_id ?? ($p->metadata['term_id'] ?? null),
                'status' => $p->status === 'success' ? 'successful' : $p->status,
            ];
        });

        $receipts = [];
        $allocations = [];

        foreach ($payments as $p) {
            foreach ($p->receipts as $r) {
                $receipts[] = [
                    'id' => $r->id,
                    'payment_id' => $p->id,
                    'receipt_number' => $r->receipt_number,
                    'date' => $r->issued_at ? $r->issued_at->format('Y-m-d') : ($p->paid_at ? $p->paid_at->format('Y-m-d') : null),
                ];
            }
            foreach ($p->allocations as $a) {
                $allocations[] = [
                    'id' => $a->id,
                    'payment_id' => $p->id,
                    'student_charge_id' => $a->student_charge_id,
                    'category_name' => $a->studentCharge?->feeStructure?->category?->name
                        ?? $a->studentCharge?->feeStructure?->name
                        ?? 'Fee Charge',
                    'amount' => (float) $a->amount,
                ];
            }
        }

        return response()->json([
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'admission_number' => $student->admission_number,
                    'current_class_id' => $student->current_class_id,
                    'current_class_name' => $student->currentClass?->name ?? '',
                ],
                'charges' => $formattedCharges,
                'payments' => $formattedPayments,
                'receipts' => $receipts,
                'allocations' => $allocations,
            ]
        ]);
    }

    protected function formatGatewayConfig(?PaymentGatewayConfig $cfg): array
    {
        if (! $cfg) {
            return [
                'status' => 'unconfigured',
                'gateway' => 'paystack',
                'gateway_name' => 'paystack',
                'has_credentials' => false,
                'enabled' => false,
                'is_active' => false,
                'environment' => 'test',
                'currency' => 'NGN',
                'webhook_secret_configured' => false,
            ];
        }

        $meta = $cfg->metadata ?? [];
        $hasCredentials = ! empty($cfg->public_key) && ! empty($cfg->secret_key_ciphertext);

        return [
            'id' => $cfg->id,
            'status' => $hasCredentials ? 'configured' : 'unconfigured',
            'gateway' => $cfg->gateway_name,
            'gateway_name' => $cfg->gateway_name,
            'public_key' => $cfg->public_key,
            'has_credentials' => $hasCredentials,
            'enabled' => (bool) $cfg->is_active,
            'is_active' => (bool) $cfg->is_active,
            'environment' => $meta['environment'] ?? 'test',
            'currency' => $meta['currency'] ?? 'NGN',
            'subaccount_code' => $meta['subaccount_code'] ?? '',
            'contract_code' => $meta['contract_code'] ?? '',
            'merchant_id' => $meta['merchant_id'] ?? '',
            'service_type_id' => $meta['service_type_id'] ?? '',
            'platform_fee' => (float) ($meta['platform_fee'] ?? 100),
            'webhook_secret_configured' => ! empty($meta['webhook_secret']),
            'last_test_status' => $meta['last_test_status'] ?? null,
            'last_test_message' => $meta['last_test_message'] ?? null,
            'last_tested_at' => $meta['last_tested_at'] ?? null,
        ];
    }

    public function manageGatewayConfig(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $action = $request->input('action', 'get');
        $gatewayName = strtolower((string) $request->input('gateway_name', $request->input('gateway', 'paystack')));
        if (! in_array($gatewayName, \App\Services\PaymentGatewayService::SUPPORTED_GATEWAYS, true)) {
            $gatewayName = 'paystack';
        }

        if ($action === 'get') {
            $cfg = PaymentGatewayConfig::where('school_id', $schoolId)
                ->when($request->filled('gateway_name') || $request->filled('gateway'), fn ($q) => $q->where('gateway_name', $gatewayName))
                ->orderByDesc('is_active')
                ->first();

            // Auto-seed a default test configuration if none exists yet so school admins can test immediately
            if (! $cfg) {
                $cfg = PaymentGatewayConfig::create([
                    'school_id' => $schoolId,
                    'gateway_name' => $gatewayName,
                    'public_key' => 'pk_test_iportal_sandbox_key',
                    'secret_key_ciphertext' => 'sk_test_iportal_sandbox_secret',
                    'is_active' => true,
                    'metadata' => [
                        'environment' => 'test',
                        'currency' => 'NGN',
                        'platform_fee' => 100,
                        'last_test_status' => 'success',
                        'last_test_message' => ucfirst($gatewayName) . ' Sandbox (Test Mode) active and ready.',
                        'last_tested_at' => now()->toIso8601String(),
                    ],
                ]);
            }

            return response()->json([
                'data' => $this->formatGatewayConfig($cfg),
            ]);
        }

        if ($action === 'save' || $action === 'update') {
            $existing = PaymentGatewayConfig::where('school_id', $schoolId)
                ->where('gateway_name', $gatewayName)
                ->first();
            $meta = $existing?->metadata ?? [];
            $meta['environment'] = $request->input('environment', $meta['environment'] ?? 'test');
            $meta['currency'] = $request->input('currency', $meta['currency'] ?? 'NGN');
            if ($request->filled('webhook_secret')) {
                $meta['webhook_secret'] = $request->input('webhook_secret');
            }
            if ($request->has('subaccount_code')) {
                $meta['subaccount_code'] = $request->input('subaccount_code');
            }
            if ($request->has('contract_code')) {
                $meta['contract_code'] = $request->input('contract_code');
            }
            if ($request->has('merchant_id')) {
                $meta['merchant_id'] = $request->input('merchant_id');
            }
            if ($request->has('service_type_id')) {
                $meta['service_type_id'] = $request->input('service_type_id');
            }
            if ($request->has('platform_fee')) {
                $meta['platform_fee'] = (float) $request->input('platform_fee', 100);
            }

            // Deactivate other gateways when saving & activating a chosen gateway
            PaymentGatewayConfig::where('school_id', $schoolId)
                ->where('gateway_name', '!=', $gatewayName)
                ->update(['is_active' => 0]);

            $config = PaymentGatewayConfig::updateOrCreate(
                ['school_id' => $schoolId, 'gateway_name' => $gatewayName],
                [
                    'public_key' => $request->input('public_key', $existing?->public_key),
                    'secret_key_ciphertext' => $request->input('secret_key', $existing?->secret_key_ciphertext),
                    'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
                    'metadata' => $meta,
                ]
            );
            return response()->json(['data' => $this->formatGatewayConfig($config)]);
        }

        if ($action === 'test') {
            $cfg = PaymentGatewayConfig::where('school_id', $schoolId)
                ->where('gateway_name', $gatewayName)
                ->first();
            $secretKey = (string) ($request->input('secret_key') ?: $cfg?->secret_key_ciphertext);

            $isValid = match ($gatewayName) {
                'flutterwave' => str_starts_with($secretKey, 'FLWSECK') || str_starts_with($secretKey, 'flw_'),
                'monnify' => str_starts_with($secretKey, 'MK_') || strlen($secretKey) >= 16,
                'remita' => strlen($secretKey) >= 6,
                default => str_starts_with($secretKey, 'sk_test_') || str_starts_with($secretKey, 'sk_live_'),
            };

            $label = ucfirst($gatewayName);
            $status = $isValid ? 'success' : 'failed';
            $message = $isValid
                ? "{$label} gateway connection verified successfully."
                : "Invalid {$label} secret key format.";

            if ($cfg) {
                $meta = $cfg->metadata ?? [];
                $meta['last_test_status'] = $status;
                $meta['last_test_message'] = $message;
                $meta['last_tested_at'] = now()->toIso8601String();
                $cfg->update(['metadata' => $meta]);
            }

            return response()->json([
                'data' => [
                    'status' => $status,
                    'message' => $message,
                ]
            ]);
        }

        if ($action === 'enable') {
            PaymentGatewayConfig::where('school_id', $schoolId)
                ->where('gateway_name', $gatewayName)
                ->update(['is_active' => 1]);
            return response()->json(['data' => ['success' => true]]);
        }

        if ($action === 'disable') {
            PaymentGatewayConfig::where('school_id', $schoolId)
                ->where('gateway_name', $gatewayName)
                ->update(['is_active' => 0]);
            return response()->json(['data' => ['success' => true]]);
        }

        if ($action === 'remove') {
            PaymentGatewayConfig::where('school_id', $schoolId)
                ->where('gateway_name', $gatewayName)
                ->delete();
            return response()->json(['data' => ['success' => true]]);
        }

        return response()->json(['error' => 'Unknown gateway action.'], 400);
    }

    public function initializeOnlinePayment(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);
        $studentId = $request->input('student_id');
        $baseAmount = (float) $request->input('amount');
        $chargeIds = $request->input('charge_ids', []);

        $student = Student::with('currentClass')->find($studentId);
        if (! $student) {
            return response()->json(['error' => 'Student record not found.'], 404);
        }

        $charges = StudentCharge::with(['academicSession', 'term', 'feeStructure.category', 'feeStructure.academicSession', 'feeStructure.term', 'paymentAllocations.payment'])
            ->where('student_id', $studentId)
            ->when(! empty($chargeIds), fn ($q) => $q->whereIn('id', $chargeIds))
            ->get();

        $allocationPlan = [];
        $sessionId = null;
        $termId = null;
        $sessionName = '';
        $termName = '';

        foreach ($charges as $c) {
            $paid = (float) $c->paymentAllocations
                ->filter(fn ($a) => $a->payment?->status === 'success')
                ->sum('amount');
            $net = (float) ($c->net_amount > 0 ? $c->net_amount : max(0, $c->amount - ($c->discount_amount ?? 0)));
            $owed = max(0, $net - $paid);
            if ($owed <= 0) {
                continue;
            }
            $sessionId = $sessionId ?? ($c->academic_session_id ?? $c->feeStructure?->academic_session_id);
            $termId = $termId ?? ($c->term_id ?? $c->feeStructure?->term_id);
            $sessionName = $sessionName ?: ($c->academicSession?->name ?? $c->feeStructure?->academicSession?->name ?? '');
            $termName = $termName ?: ($c->term?->name ?? $c->feeStructure?->term?->name ?? '');

            $allocationPlan[] = [
                'charge_id' => $c->id,
                'category_name' => $c->feeStructure?->category?->name ?? ($c->feeStructure?->name ?? 'Fee Charge'),
                'amount' => $owed,
            ];
        }

        $requestedGateway = strtolower((string) $request->input('gateway', ''));
        $cfg = PaymentGatewayConfig::where('school_id', $schoolId)
            ->when($requestedGateway !== '', fn ($q) => $q->where('gateway_name', $requestedGateway))
            ->orderByDesc('is_active')
            ->first();

        $gateway = $requestedGateway !== '' && in_array($requestedGateway, \App\Services\PaymentGatewayService::SUPPORTED_GATEWAYS, true)
            ? $requestedGateway
            : ($cfg?->gateway_name ?? 'paystack');

        $platformFee = (float) ($cfg?->metadata['platform_fee'] ?? 100.00);
        $split = \App\Services\PaymentGatewayService::calculateFeeSplit($baseAmount, $gateway, $platformFee);

        $ref = 'OPT-' . date('Ymd') . '-' . strtoupper(Str::random(8));
        $user = $request->user();
        $localCallbackPath = "/app/payment-status?ref={$ref}&reference={$ref}&status=success";

        $initInfo = \App\Services\PaymentGatewayService::initializeGatewaySession(
            $cfg,
            $gateway,
            $ref,
            $user?->email ?? ($student->email ?: 'payments@iportal.edu.ng'),
            $user?->full_name ?? $student->full_name,
            $split,
            $localCallbackPath
        );

        OnlinePaymentTransaction::create([
            'school_id' => $schoolId,
            'gateway' => $gateway,
            'gateway_reference' => $ref,
            'status' => 'initiated',
            'request_payload' => [
                'student_id' => $student->id,
                'student_name' => $student->full_name,
                'payer_name' => $user?->full_name ?? $student->full_name,
                'amount' => $split['base_amount'],
                'base_amount' => $split['base_amount'],
                'gateway_fee' => $split['gateway_fee'],
                'platform_fee' => $split['platform_fee'],
                'convenience_fee' => $split['convenience_fee'],
                'total_payable' => $split['total_payable'],
                'fee_split' => $split,
                'charge_ids' => $chargeIds,
                'allocation_plan' => $allocationPlan,
                'academic_session_id' => $sessionId,
                'term_id' => $termId,
                'session_name' => $sessionName,
                'term_name' => $termName,
                'environment' => $initInfo['environment'],
                'rrr' => $initInfo['rrr'] ?? null,
                'initiated_at' => now()->toIso8601String(),
            ],
            'response_payload' => [
                'authorization_url' => $initInfo['authorization_url'],
                'gateway_reference' => $initInfo['gateway_reference'],
                'rrr' => $initInfo['rrr'] ?? null,
            ],
        ]);

        return response()->json([
            'data' => [
                'authorization_url' => $initInfo['authorization_url'],
                'reference' => $ref,
                'gateway' => $gateway,
                'environment' => $initInfo['environment'] ?? 'test',
                'rrr' => $initInfo['rrr'] ?? null,
                'service_type_id' => $cfg?->metadata['service_type_id'] ?? '4430731',
                'payer_name' => $user?->full_name ?? $student->full_name,
                'payer_email' => $user?->email ?? ($student->email ?: 'payments@iportal.edu.ng'),
                'student_name' => $student->full_name,
                'admission_number' => $student->admission_number,
                'session_name' => $sessionName,
                'term_name' => $termName,
                'allocation_plan' => $allocationPlan,
                'fee_split' => $split,
            ]
        ]);
    }

    public function settleOnlineTransaction(OnlinePaymentTransaction $tx, ?int $userId = null): OnlinePaymentTransaction
    {
        return \App\Services\PaymentGatewayService::settleTransaction($tx->gateway_reference, $userId) ?? $tx;
    }

    public function getOnlinePaymentStatus(Request $request): JsonResponse
    {
        $ref = $request->input('internal_reference') ?? $request->input('reference');
        $tx = OnlinePaymentTransaction::with(['payment.student', 'payment.receipts', 'payment.allocations.studentCharge.feeStructure.category'])
            ->where('gateway_reference', $ref)
            ->first();

        if (! $tx) {
            return response()->json(['error' => 'Transaction reference not found.'], 404);
        }

        // Idempotent settlement via PaymentGatewayService
        if (in_array($tx->status, ['initiated', 'pending'])) {
            $tx = \App\Services\PaymentGatewayService::settleTransaction($ref, $request->user()?->id) ?? $tx;
        }

        $formatted = OnlinePaymentTransactionController::formatTransaction($tx);

        return response()->json([
            'data' => [
                'status' => $tx->status,
                'reference' => $ref,
                'transaction' => $formatted,
            ]
        ]);
    }

    public function handlePaystackWebhook(Request $request): JsonResponse
    {
        return app(WebhookController::class)->handle($request, 'paystack');
    }

    public function manageSubscription(Request $request): JsonResponse
    {
        $action = $request->input('action', 'create');
        $ctrl = app(SubscriptionController::class);

        if ($action === 'create') {
            return $ctrl->store($request);
        }

        $subId = (int) $request->input('subscription_id');
        if (in_array($action, ['suspend', 'cancel', 'activate'])) {
            $statusMap = ['suspend' => 'cancelled', 'cancel' => 'cancelled', 'activate' => 'active'];
            $request->merge(['status' => $statusMap[$action]]);
        }

        return $ctrl->update($request, $subId);
    }

    public function managePlatformTransaction(Request $request): JsonResponse
    {
        $tx = PlatformTransaction::create([
            'school_id' => $request->input('school_id'),
            'tx_type' => $request->input('tx_type', $request->input('type', 'subscription')),
            'reference' => $request->input('reference', 'PTX-' . strtoupper(Str::random(8))),
            'amount' => (float) $request->input('amount', 0),
            'currency' => 'NGN',
            'status' => $request->input('status', 'success'),
        ]);

        return response()->json(['data' => $tx], 201);
    }
}
