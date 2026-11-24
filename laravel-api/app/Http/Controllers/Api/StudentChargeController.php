<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeStructure;
use App\Models\StudentCharge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentChargeController extends Controller
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
        $query = StudentCharge::query()
            ->with([
                'academicSession',
                'term',
                'feeStructure.category',
                'feeStructure.academicSession',
                'feeStructure.term',
                'paymentAllocations.payment',
                'student',
            ])
            ->where('school_id', $schoolId);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        if ($request->filled('academic_session_id')) {
            $sessId = $request->query('academic_session_id');
            $query->where(function ($q) use ($sessId) {
                $q->where('academic_session_id', $sessId)
                  ->orWhereHas('feeStructure', function ($fsq) use ($sessId) {
                      $fsq->where('academic_session_id', $sessId);
                  });
            });
        }

        if ($request->filled('term_id')) {
            $tId = $request->query('term_id');
            $query->where(function ($q) use ($tId) {
                $q->where('term_id', $tId)
                  ->orWhereHas('feeStructure', function ($fsq) use ($tId) {
                      $fsq->where('term_id', $tId);
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $s = '%' . trim((string) $request->query('search')) . '%';
            $query->whereHas('student', function ($sq) use ($s) {
                $sq->where('full_name', 'like', $s)
                   ->orWhere('admission_number', 'like', $s)
                   ->orWhereHas('user', function ($uq) use ($s) {
                       $uq->where('login_pin', 'like', $s)
                          ->orWhere('platform_pin', 'like', $s);
                   });
            });
        }

        $sort = $request->query('sort', '-created_at');
        if (str_starts_with($sort, '-')) {
            $col = ltrim($sort, '-');
            if ($col === 'created_date') $col = 'created_at';
            $query->orderByDesc($col);
        } else {
            $col = $sort;
            if ($col === 'created_date') $col = 'created_at';
            $query->orderBy($col);
        }

        if ($request->filled('page') || $request->filled('per_page')) {
            $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
            $paginator = $query->paginate($perPage);

            return response()->json([
                'data' => collect($paginator->items())->map(fn (StudentCharge $c) => $this->formatCharge($c))->values(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem() ?? 0,
                    'to' => $paginator->lastItem() ?? 0,
                ],
            ]);
        }

        $limit = min((int) ($request->query('limit', 2000)), 5000);
        $charges = $query->limit($limit)->get();

        $formatted = $charges->map(function (StudentCharge $c) {
            return $this->formatCharge($c);
        });

        return response()->json($formatted);
    }

    public function store(Request $request): JsonResponse
    {
        $schoolId = $this->resolveSchoolId($request);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'fee_structure_id' => 'nullable|exists:fee_structures,id',
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'term_id' => 'nullable|exists:terms,id',
            'amount' => 'required|numeric|min:0.01',
            'discount_amount' => 'nullable|numeric|min:0',
            'net_amount' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:pending,partial,partially_paid,paid,overdue,waived,cancelled',
        ]);

        $feeStructure = ! empty($validated['fee_structure_id']) ? FeeStructure::find($validated['fee_structure_id']) : null;
        $sessionId = $validated['academic_session_id'] ?? $feeStructure?->academic_session_id;
        $termId = $validated['term_id'] ?? $feeStructure?->term_id;

        $amount = (float) $validated['amount'];
        $discount = (float) ($validated['discount_amount'] ?? 0);
        $netAmount = (float) ($validated['net_amount'] ?? ($amount - $discount));
        $status = $validated['status'] ?? 'pending';

        $charge = StudentCharge::create([
            'school_id' => $schoolId,
            'student_id' => $validated['student_id'],
            'fee_structure_id' => $validated['fee_structure_id'] ?? null,
            'academic_session_id' => $sessionId,
            'term_id' => $termId,
            'amount' => $amount,
            'discount_amount' => $discount,
            'net_amount' => $netAmount,
            'currency' => 'NGN',
            'status' => $status === 'partially_paid' ? 'partial' : $status,
            'due_date' => $validated['due_date'] ?? ($feeStructure?->due_date?->format('Y-m-d')),
            'notes' => $validated['notes'] ?? null,
        ]);

        $charge->load(['academicSession', 'term', 'feeStructure.category', 'feeStructure.academicSession', 'feeStructure.term', 'paymentAllocations.payment', 'student']);
        return response()->json($this->formatCharge($charge), 201);
    }

    public function show(StudentCharge $studentCharge): JsonResponse
    {
        $studentCharge->load(['academicSession', 'term', 'feeStructure.category', 'feeStructure.academicSession', 'feeStructure.term', 'paymentAllocations.payment', 'student']);
        return response()->json($this->formatCharge($studentCharge));
    }

    public function update(Request $request, StudentCharge $studentCharge): JsonResponse
    {
        $validated = $request->validate([
            'discount_amount' => 'nullable|numeric|min:0',
            'net_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,partial,partially_paid,paid,overdue,waived,cancelled',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $amount = (float) $studentCharge->amount;
        $discount = isset($validated['discount_amount']) ? (float) $validated['discount_amount'] : (float) $studentCharge->discount_amount;
        $net = isset($validated['net_amount']) ? (float) $validated['net_amount'] : max(0, $amount - $discount);
        $status = $validated['status'] ?? $studentCharge->status;

        if ($status === 'waived') {
            $discount = $amount;
            $net = 0;
        }

        $studentCharge->update([
            'discount_amount' => $discount,
            'net_amount' => $net,
            'status' => $status === 'partially_paid' ? 'partial' : $status,
            'notes' => $validated['notes'] ?? $studentCharge->notes,
            'due_date' => $validated['due_date'] ?? $studentCharge->due_date,
        ]);

        $studentCharge->load(['academicSession', 'term', 'feeStructure.category', 'feeStructure.academicSession', 'feeStructure.term', 'paymentAllocations.payment', 'student']);
        return response()->json($this->formatCharge($studentCharge));
    }

    public function destroy(StudentCharge $studentCharge): JsonResponse
    {
        if ($studentCharge->paymentAllocations()->exists()) {
            return response()->json([
                'error' => 'Cannot delete a charge that has allocated payments. Reverse payment first.'
            ], 422);
        }

        $studentCharge->delete();
        return response()->json(['message' => 'Charge deleted successfully.']);
    }

    protected function formatCharge(StudentCharge $c): array
    {
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
            'school_id' => $c->school_id,
            'student_id' => $c->student_id,
            'student_name' => $c->student?->full_name ?? '',
            'admission_number' => $c->student?->admission_number ?? '',
            'fee_structure_id' => $c->fee_structure_id,
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
            'currency' => $c->currency ?? 'NGN',
            'status' => $status,
            'due_date' => $c->due_date ? $c->due_date->format('Y-m-d') : null,
            'notes' => $c->notes,
            'created_at' => $c->created_at?->toIso8601String(),
            'created_date' => $c->created_at?->toIso8601String(),
        ];
    }
}
