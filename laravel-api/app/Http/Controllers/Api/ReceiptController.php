<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptController extends Controller
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
        $query = Receipt::query()
            ->with(['payment.student', 'payment.allocations.studentCharge.feeStructure'])
            ->where('school_id', $schoolId);

        if ($request->filled('payment_id')) {
            $query->where('payment_id', $request->query('payment_id'));
        }

        if ($request->filled('student_id')) {
            $studentId = $request->query('student_id');
            $query->whereHas('payment', function ($pq) use ($studentId) {
                $pq->where('student_id', $studentId);
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

        $limit = min((int) ($request->query('limit', 1000)), 5000);
        $receipts = $query->limit($limit)->get();

        $formatted = $receipts->map(function (Receipt $r) {
            return $this->formatReceipt($r);
        });

        return response()->json($formatted);
    }

    public function show(Receipt $receipt): JsonResponse
    {
        $receipt->load(['payment.student', 'payment.allocations.studentCharge.feeStructure']);
        return response()->json($this->formatReceipt($receipt));
    }

    protected function formatReceipt(Receipt $r): array
    {
        $p = $r->payment;
        return [
            'id' => $r->id,
            'school_id' => $r->school_id,
            'payment_id' => $r->payment_id,
            'receipt_number' => $r->receipt_number,
            'student_id' => $p?->student_id,
            'student_name' => $p?->student?->full_name ?? '',
            'admission_number' => $p?->student?->admission_number ?? '',
            'amount' => (float) ($p?->amount ?? 0),
            'payment_method' => $p?->payment_method ?? 'cash',
            'payment_reference' => $p?->reference_number ?? '',
            'payment_date' => $p?->paid_at ? $p->paid_at->format('Y-m-d') : ($p?->created_at ? $p->created_at->format('Y-m-d') : null),
            'issued_at' => $r->issued_at ? $r->issued_at->toIso8601String() : $r->created_at?->toIso8601String(),
            'created_at' => $r->created_at?->toIso8601String(),
            'created_date' => $r->created_at?->toIso8601String(),
        ];
    }
}
