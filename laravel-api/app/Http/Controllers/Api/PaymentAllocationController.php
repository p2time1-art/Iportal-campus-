<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentAllocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentAllocationController extends Controller
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
        $query = PaymentAllocation::query()
            ->with(['studentCharge.feeStructure.category'])
            ->where('school_id', $schoolId);

        if ($request->filled('payment_id')) {
            $query->where('payment_id', $request->query('payment_id'));
        }

        if ($request->filled('student_charge_id')) {
            $query->where('student_charge_id', $request->query('student_charge_id'));
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

        $limit = min((int) ($request->query('limit', 100)), 500);
        $allocs = $query->limit($limit)->get();

        $formatted = $allocs->map(function (PaymentAllocation $pa) {
            $charge = $pa->studentCharge;
            $fs = $charge?->feeStructure;
            return [
                'id' => $pa->id,
                'school_id' => $pa->school_id,
                'payment_id' => $pa->payment_id,
                'student_charge_id' => $pa->student_charge_id,
                'fee_name' => $fs?->name ?? 'Fee Charge',
                'name' => $fs?->name ?? 'Fee Charge',
                'category_name' => $fs?->category?->name ?? 'General',
                'amount' => (float) $pa->amount,
                'created_at' => $pa->created_at?->toIso8601String(),
                'created_date' => $pa->created_at?->toIso8601String(),
            ];
        });

        return response()->json($formatted);
    }
}
