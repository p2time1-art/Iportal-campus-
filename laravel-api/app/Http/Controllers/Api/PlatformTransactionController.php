<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlatformTransaction::with('school');

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }
        if ($request->filled('status')) {
            $st = $request->query('status');
            if ($st === 'successful') {
                $st = 'success';
            }
            $query->where('status', $st);
        }

        $txns = $query->orderByDesc('id')->limit(500)->get()->map(function (PlatformTransaction $t) {
            $meta = $t->metadata ?? [];
            return [
                'id' => $t->id,
                'school_id' => $t->school_id,
                'school_name' => $t->school?->name ?? 'School',
                'tx_type' => $t->tx_type,
                'type' => $t->tx_type,
                'payment_method' => $meta['payment_method'] ?? $t->tx_type,
                'reference' => $t->reference,
                'external_reference' => $t->reference,
                'amount' => (float) $t->amount,
                'currency' => $t->currency ?? 'NGN',
                'status' => $t->status === 'success' ? 'successful' : $t->status,
                'transaction_date' => $t->created_at?->format('Y-m-d'),
                'payment_date' => $t->created_at?->format('Y-m-d'),
                'created_at' => $t->created_at?->toIso8601String(),
                'created_date' => $t->created_at?->toIso8601String(),
            ];
        });

        return response()->json($txns);
    }
}
