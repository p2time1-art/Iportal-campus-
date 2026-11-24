<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Receipt;
use App\Models\Student;
use App\Models\StudentCharge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
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
        $query = Payment::query()
            ->with(['student', 'receipts', 'allocations'])
            ->where('school_id', $schoolId);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->query('academic_session_id'));
        }

        if ($request->filled('term_id')) {
            $query->where('term_id', $request->query('term_id'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        if ($request->filled('status')) {
            $st = $request->query('status');
            if ($st === 'successful') $st = 'success';
            $query->where('status', $st);
        }

        if ($request->filled('search')) {
            $s = '%' . trim((string) $request->query('search')) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('reference_number', 'like', $s)
                  ->orWhereHas('receipts', fn ($rq) => $rq->where('receipt_number', 'like', $s))
                  ->orWhereHas('student', function ($sq) use ($s) {
                      $sq->where('full_name', 'like', $s)
                         ->orWhere('admission_number', 'like', $s)
                         ->orWhereHas('user', function ($uq) use ($s) {
                             $uq->where('login_pin', 'like', $s)
                                ->orWhere('platform_pin', 'like', $s);
                         });
                  });
            });
        }

        $sort = $request->query('sort', '-payment_date');
        if (str_starts_with($sort, '-')) {
            $col = ltrim($sort, '-');
            if (in_array($col, ['payment_date', 'paid_at', 'created_date'])) $col = 'paid_at';
            $query->orderByDesc($col);
        } else {
            $col = $sort;
            if (in_array($col, ['payment_date', 'paid_at', 'created_date'])) $col = 'paid_at';
            $query->orderBy($col);
        }

        if ($request->filled('page') || $request->filled('per_page')) {
            $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
            $totalSuccessful = (float) (clone $query)->where('status', 'success')->sum('amount');
            $paginator = $query->paginate($perPage);

            return response()->json([
                'data' => collect($paginator->items())->map(fn (Payment $p) => $this->formatPayment($p))->values(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem() ?? 0,
                    'to' => $paginator->lastItem() ?? 0,
                    'total_successful_amount' => $totalSuccessful,
                ],
            ]);
        }

        $limit = min((int) ($request->query('limit', 1000)), 5000);
        $payments = $query->limit($limit)->get();

        $formatted = $payments->map(function (Payment $p) {
            return $this->formatPayment($p);
        });

        return response()->json($formatted);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'finance.record_payment')) {
            return response()->json([
                'error' => 'Access denied: Exam Officer / Principal role is restricted to Academic Operations and cannot record financial payments.',
                'message' => 'Access denied: Exam Officer / Principal role is restricted to Academic Operations and cannot record financial payments.',
            ], 403);
        }

        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'payment_date' => 'nullable|date',
            'paid_at' => 'nullable|date',
            'payment_reference' => 'nullable|string',
            'reference_number' => 'nullable|string',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'term_id' => 'nullable|exists:terms,id',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $ref = $validated['reference_number'] ?? $validated['payment_reference'] ?? ('PAY-' . strtoupper(Str::random(10)));
        $paidDate = $validated['paid_at'] ?? $validated['payment_date'] ?? now();
        $status = ($validated['status'] ?? 'successful') === 'successful' ? 'success' : ($validated['status'] ?? 'success');

        $payment = Payment::create([
            'school_id' => $schoolId,
            'student_id' => $validated['student_id'],
            'user_id' => $request->user()?->id,
            'amount' => $validated['amount'],
            'currency' => 'NGN',
            'payment_method' => $validated['payment_method'],
            'gateway' => $validated['payment_method'] === 'online' ? 'paystack' : null,
            'status' => $status,
            'reference_number' => $ref,
            'academic_session_id' => $validated['academic_session_id'] ?? null,
            'term_id' => $validated['term_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'paid_at' => $paidDate,
            'metadata' => [
                'notes' => $validated['notes'] ?? null,
                'academic_session_id' => $validated['academic_session_id'] ?? null,
                'term_id' => $validated['term_id'] ?? null,
            ],
        ]);

        // Auto-allocate against student's outstanding charges
        $remaining = (float) $validated['amount'];
        $allocations = [];

        $charges = StudentCharge::where('school_id', $schoolId)
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
                $allocations[] = $alloc;
                $remaining -= $allocAmt;

                if ($paidSoFar + $allocAmt >= $net) {
                    $charge->update(['status' => 'paid', 'paid_at' => now()]);
                } else {
                    $charge->update(['status' => 'partial']);
                }
            }
        }

        // Issue Receipt
        $receipt = Receipt::create([
            'school_id' => $schoolId,
            'payment_id' => $payment->id,
            'receipt_number' => 'REC-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
            'issued_at' => now(),
        ]);

        $payment->load(['student', 'receipts', 'allocations']);
        $res = $this->formatPayment($payment);
        $res['receipt_id'] = $receipt->id;
        $res['allocations'] = $allocations;

        return response()->json($res, 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['student', 'receipts', 'allocations.studentCharge.feeStructure']);
        return response()->json($this->formatPayment($payment));
    }

    public function update(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'successful') {
            $validated['status'] = 'success';
        }

        $payment->update($validated);
        $payment->load(['student', 'receipts', 'allocations']);

        return response()->json($this->formatPayment($payment));
    }

    public function destroy(Payment $payment): JsonResponse
    {
        // Revert allocations and restore charges
        foreach ($payment->allocations as $alloc) {
            $charge = $alloc->studentCharge;
            if ($charge) {
                $charge->update(['status' => 'pending', 'paid_at' => null]);
            }
            $alloc->delete();
        }

        $payment->receipts()->delete();
        $payment->delete();

        return response()->json(['message' => 'Payment record deleted and balances restored.']);
    }

    public function reverse(Request $request, Payment $payment): JsonResponse
    {
        if ($request->user() && ! \App\Services\RolePermissionService::userCan($request->user(), 'finance.reverse_payment')) {
            return response()->json([
                'error' => 'Access denied: Exam Officer / Principal role cannot reverse financial payments.',
                'message' => 'Access denied: Exam Officer / Principal role cannot reverse financial payments.',
            ], 403);
        }

        $reason = $request->input('reason', 'Reversed by administrator');

        $payment->update([
            'status' => 'reversed',
            'notes' => ($payment->notes ? $payment->notes . ' | ' : '') . "Reversed: {$reason}",
        ]);

        // Revert charge statuses
        foreach ($payment->allocations as $alloc) {
            $charge = $alloc->studentCharge;
            if ($charge) {
                $charge->update(['status' => 'pending', 'paid_at' => null]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment reversed successfully.',
            'payment' => $this->formatPayment($payment)
        ]);
    }

    protected function formatPayment(Payment $p): array
    {
        $status = $p->status === 'success' ? 'successful' : $p->status;
        $paidDate = $p->paid_at ? $p->paid_at->format('Y-m-d') : ($p->created_at ? $p->created_at->format('Y-m-d') : null);

        return [
            'id' => $p->id,
            'school_id' => $p->school_id,
            'student_id' => $p->student_id,
            'student_name' => $p->student?->full_name ?? ($p->metadata['student_name'] ?? 'Student'),
            'admission_number' => $p->student?->admission_number ?? '',
            'user_id' => $p->user_id,
            'amount' => (float) $p->amount,
            'currency' => $p->currency ?? 'NGN',
            'payment_method' => $p->payment_method,
            'gateway' => $p->gateway,
            'payment_reference' => $p->reference_number,
            'reference_number' => $p->reference_number,
            'payment_date' => $paidDate,
            'paid_at' => $p->paid_at?->toIso8601String(),
            'academic_session_id' => $p->academic_session_id ?? ($p->metadata['academic_session_id'] ?? null),
            'term_id' => $p->term_id ?? ($p->metadata['term_id'] ?? null),
            'notes' => $p->notes ?? ($p->metadata['notes'] ?? null),
            'status' => $status,
            'receipt' => $p->receipts->first(),
            'receipt_id' => $p->receipts->first()?->id,
            'created_at' => $p->created_at?->toIso8601String(),
            'created_date' => $p->created_at?->toIso8601String(),
        ];
    }
}
